package com.stresschecker.service;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.sheets.v4.Sheets;
import com.google.api.services.sheets.v4.SheetsScopes;
import com.google.api.services.sheets.v4.model.ValueRange;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import com.stresschecker.model.UserData;
import com.stresschecker.repository.UserDataRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.*;

@Service
public class SheetsSyncService {

    @Value("${sheets.credentials.path:student-stress-level-checker-622e5c819593.json}")
    private String sheetsKeyPath;

    @Value("${spreadsheet.id:1ADNYDE4yJhZ2YVjqWZyq4-FS01cb2yVwPyQI94Yj7gI}")
    private String spreadsheetId;

    private final UserDataRepository userDataRepository;
    private Sheets sheetsService;

    public SheetsSyncService(UserDataRepository userDataRepository) {
        this.userDataRepository = userDataRepository;
    }

    @PostConstruct
    public void initSheets() {
        try {
            String path = sheetsKeyPath;
            if (!path.contains("/") && !path.contains("\\")) {
                path = System.getProperty("user.dir") + "/" + path;
            }
            GoogleCredentials creds = GoogleCredentials.fromStream(new FileInputStream(path))
                    .createScoped(Collections.singleton(SheetsScopes.SPREADSHEETS_READONLY));
            sheetsService = new Sheets.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    GsonFactory.getDefaultInstance(),
                    new HttpCredentialsAdapter(creds))
                    .setApplicationName("Stress Level Checker")
                    .build();
            System.out.println("✅ Google Sheets Service Initialized");
        } catch (IOException | GeneralSecurityException e) {
            throw new RuntimeException("Failed to initialize Google Sheets: " + e.getMessage(), e);
        }
    }

    private static final Map<String, Integer> ANSWER_MAPPING = new HashMap<String, Integer>() {
        {
            put("A", 0);
            put("B", 1);
            put("C", 2);
            put("D", 3);
        }
    };

    private static final int MAX_SCORE = 16 * 3; // 48

    public int[] calculateStressScore(List<Object> answers) {
        int[] numeric = new int[answers.size()];
        for (int i = 0; i < answers.size(); i++) {
            Object ans = answers.get(i);
            String clean = ans != null ? ans.toString().trim().toUpperCase() : "A";
            char first = clean.isEmpty() ? 'A' : clean.charAt(0);
            int val = ANSWER_MAPPING.getOrDefault(String.valueOf(first), 0);
            numeric[i] = val;
        }
        return numeric;
    }

    public int getTotalScore(int[] numericAnswers) {
        int t = 0;
        for (int n : numericAnswers)
            t += n;
        return t;
    }

    public String[] determineStressLevel(int score) {
        double percentage = (score * 100.0) / MAX_SCORE;
        if (percentage <= 33) {
            return new String[] { "Low Stress", "green" };
        } else if (percentage <= 66) {
            return new String[] { "Medium Stress", "yellow" };
        } else {
            return new String[] { "High Stress", "red" };
        }
    }

    public void syncData() throws IOException {

        System.out.println("📥 Fetching data from Sheet: " + spreadsheetId + "...");

        Sheets.Spreadsheets.Get request = sheetsService.spreadsheets().get(spreadsheetId);
        var sheetMetadata = request.execute();
        var sheets = sheetMetadata.getSheets();
        if (sheets == null || sheets.isEmpty()) {
            System.out.println("❌ No sheets found in spreadsheet.");
            return;
        }
        String actualSheetTitle = sheets.get(0).getProperties().getTitle();
        System.out.println("✅ Found Sheet Name: '" + actualSheetTitle + "'");

        String range = "'" + actualSheetTitle + "'";
        ValueRange result = sheetsService.spreadsheets().values().get(spreadsheetId, range).execute();
        List<List<Object>> rows = result.getValues();
        if (rows == null || rows.isEmpty()) {
            System.out.println("⚠️ No data found in Sheet.");
            return;
        }

        List<Object> headers = rows.get(0);
        int emailIdx = -1;
        for (int i = 0; i < headers.size(); i++) {
            if ("Email Address".equals(headers.get(i).toString())) {
                emailIdx = i;
                break;
            }
        }
        if (emailIdx < 0) {
            for (int i = 0; i < headers.size(); i++) {
                if (i < rows.get(1).size() && rows.get(1).get(i).toString().contains("@")) {
                    emailIdx = i;
                    break;
                }
            }
        }
        if (emailIdx < 0) {
            System.out.println("❌ Could not find 'Email Address' column.");
            return;
        }

        int count = 0;
        List<UserData> batchToSave = new ArrayList<>();

        for (int r = 1; r < rows.size(); r++) {
            List<Object> row = rows.get(r);
            if (row.size() <= emailIdx)
                continue;
            String email = row.get(emailIdx).toString().toLowerCase().trim();
            if (email.isEmpty() || !email.contains("@"))
                continue;

            int end = Math.min(emailIdx + 1 + 16, row.size());
            List<Object> rawAnswers = new ArrayList<>();
            for (int c = emailIdx + 1; c < end; c++) {
                rawAnswers.add(c < row.size() ? row.get(c) : "A");
            }
            while (rawAnswers.size() < 16)
                rawAnswers.add("A");

            int[] numericAnswers = calculateStressScore(rawAnswers);
            int totalScore = getTotalScore(numericAnswers);
            String[] levelAndColor = determineStressLevel(totalScore);

            List<Long> answersList = new ArrayList<>();
            for (int n : numericAnswers)
                answersList.add((long) n);

            // Create Detailed Responses (Question + Answer + Score)
            List<Map<String, Object>> detailedResponses = new ArrayList<>();
            for (int i = 0; i < numericAnswers.length; i++) {
                int colIndex = emailIdx + 1 + i;
                String question = "Question " + (i + 1);
                if (colIndex < headers.size()) {
                    question = headers.get(colIndex).toString();
                }

                String answer = rawAnswers.get(i).toString();
                int score = numericAnswers[i];

                Map<String, Object> detail = new HashMap<>();
                detail.put("question", question);
                detail.put("answer", answer);
                detail.put("score", score);
                detailedResponses.add(detail);
            }

            UserData userData = new UserData(
                    email, answersList, totalScore,
                    levelAndColor[0], levelAndColor[1], detailedResponses);
            batchToSave.add(userData);
            count++;

            // Save in batches of 400
            if (batchToSave.size() >= 400) {
                userDataRepository.saveAll(batchToSave);
                batchToSave.clear();
                System.out.println("💾 Committed batch, total so far: " + count);
            }
        }

        if (!batchToSave.isEmpty()) {
            userDataRepository.saveAll(batchToSave);
        }

        System.out.println("✅ Successfully synced " + count + " student records to MongoDB Atlas!");
    }
}
