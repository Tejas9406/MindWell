package com.stresschecker.controller;

import com.stresschecker.model.*;
import com.stresschecker.repository.UserDataRepository;
import com.stresschecker.repository.ChatHistoryRepository;
import com.stresschecker.service.GeminiChatService;
import com.stresschecker.service.SheetsSyncService;
import com.stresschecker.service.FreesoundService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
public class ApiController {

    private final FreesoundService freesoundService;
    private final SheetsSyncService sheetsSyncService;
    private final GeminiChatService geminiChatService;
    private final UserDataRepository userDataRepository;
    private final ChatHistoryRepository chatHistoryRepository;

    private static final int MAX_HISTORY_TURNS = 20;

    public ApiController(SheetsSyncService sheetsSyncService, GeminiChatService geminiChatService,
            UserDataRepository userDataRepository, FreesoundService freesoundService,
            ChatHistoryRepository chatHistoryRepository) {
        this.sheetsSyncService = sheetsSyncService;
        this.geminiChatService = geminiChatService;
        this.userDataRepository = userDataRepository;
        this.freesoundService = freesoundService;
        this.chatHistoryRepository = chatHistoryRepository;
    }

    @GetMapping("/")
    public Map<String, String> home() {
        return Map.of(
                "status", "healthy",
                "message", "Student Stress Level Checker API is running (MongoDB Atlas)");
    }

    @GetMapping("/favicon.ico")
    public ResponseEntity<Void> favicon() {
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/sync-responses")
    public ResponseEntity<Map<String, Object>> triggerSync() {
        try {
            sheetsSyncService.syncData();
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Sync to MongoDB Atlas completed successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "error", e.getMessage()));
        }
    }

    @PostMapping("/api/chat")
    public ResponseEntity<?> chat(@RequestBody ChatRequest request) {
        String userMessage = request.getMessage();
        String userEmail = request.getEmail();

        if (userMessage == null || userMessage.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message is required"));
        }

        Map<String, Object> stressContext = new HashMap<>();
        if (userEmail != null && !userEmail.isBlank()) {
            try {
                Optional<UserData> userOpt = userDataRepository.findById(userEmail);
                if (userOpt.isPresent()) {
                    UserData user = userOpt.get();
                    stressContext.put("level", user.getStressLevel());
                    stressContext.put("score", user.getTotalScore());
                }
            } catch (Exception e) {
                System.err.println("Error fetching user context from MongoDB: " + e.getMessage());
            }
        }

        List<Map<String, String>> history = new ArrayList<>();
        ChatHistory chatHistory = null;
        if (userEmail != null && !userEmail.isBlank()) {
            try {
                Optional<ChatHistory> histOpt = chatHistoryRepository.findById(userEmail);
                if (histOpt.isPresent()) {
                    chatHistory = histOpt.get();
                    history = chatHistory.getMessages();
                } else {
                    chatHistory = new ChatHistory(userEmail);
                }
            } catch (Exception e) {
                System.err.println("Error fetching chat history from MongoDB: " + e.getMessage());
                chatHistory = new ChatHistory(userEmail != null ? userEmail : "anonymous");
            }
        }

        String response = geminiChatService.getAiResponse(userMessage, stressContext, history);

        if (userEmail != null && !userEmail.isBlank() && chatHistory != null) {
            try {
                history.add(Map.of("role", "user", "text", userMessage));
                history.add(Map.of("role", "model", "text", response));
                while (history.size() > MAX_HISTORY_TURNS) {
                    history.remove(0);
                }
                chatHistory.setMessages(history);
                chatHistory.setLastUpdated(new Date());
                chatHistoryRepository.save(chatHistory);
            } catch (Exception e) {
                System.err.println("Error saving chat history to MongoDB: " + e.getMessage());
            }
        }

        return ResponseEntity.ok(new ChatResponse(response));
    }

    @GetMapping("/api/music")
    public List<MusicItem> getMusic(@RequestParam(required = false) String stressLevel,
            @RequestParam(required = false) String search) {
        String query = "relaxation music";

        if (search != null && !search.isEmpty()) {
            query = search;
        } else if (stressLevel != null) {
            if (stressLevel.equalsIgnoreCase("High Stress")) {
                query = "calm nature sounds rain forest";
            } else if (stressLevel.equalsIgnoreCase("Medium Stress")) {
                query = "lofi chill beats piano";
            } else if (stressLevel.equalsIgnoreCase("Low Stress")) {
                query = "upbeat positive energy pop";
            }
        }

        return freesoundService.searchSounds(query);
    }

    @GetMapping("/api/articles")
    public List<ArticleItem> getArticles() {
        return List.of(
                new ArticleItem(1, "Understanding Stress Management",
                        "Learn the basics of stress management and how to identify your triggers.",
                        "https://www.apa.org/topics/stress/tips",
                        "https://images.unsplash.com/photo-1517021897933-0e0319cfbc28?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
                        "APA"),
                new ArticleItem(2, "The Benefits of Mindfulness",
                        "Discover how mindfulness can reduce anxiety and improve your overall well-being.",
                        "https://www.mayoclinic.org/healthy-lifestyle/consumer-health/in-depth/mindfulness-exercises/art-20046356",
                        "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
                        "Mayo Clinic"),
                new ArticleItem(3, "Simple Breathing Exercises",
                        "Quick and effective breathing techniques to help you calm down instantly.",
                        "https://www.health.harvard.edu/mind-and-mood/relaxation-techniques-breath-control-helps-quell-errant-stress-response",
                        "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
                        "Harvard Health"),
                new ArticleItem(4, "Sleep and Mental Health",
                        "Why good sleep is crucial for your mental health and tips to get better rest.",
                        "https://www.sleepfoundation.org/mental-health",
                        "https://images.unsplash.com/photo-1541781777621-3914296d36e7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
                        "Sleep Foundation"));
    }

    @PostMapping("/api/insights")
    public ResponseEntity<?> getInsights(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }

        try {
            Optional<UserData> userOpt = userDataRepository.findById(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "User not found"));
            }

            UserData user = userOpt.get();
            List<Map<String, Object>> detailedResponses = user.getDetailedResponses();
            if (detailedResponses == null || detailedResponses.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "No detailed responses found. Please ensure data is synced."));
            }

            List<Map<String, Object>> insights = geminiChatService.generateInsights(detailedResponses);
            return ResponseEntity.ok(insights);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to generate insights: " + e.getMessage()));
        }
    }

    @GetMapping("/api/user-data")
    public ResponseEntity<?> getUserData(@RequestParam String email) {
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }
        try {
            Optional<UserData> userOpt = userDataRepository.findById(email.toLowerCase().trim());
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "User not found. Please sync data first."));
            }
            UserData user = userOpt.get();
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("email", user.getEmail());
            response.put("stress_level", user.getStressLevel());
            response.put("total_score", user.getTotalScore());
            response.put("color_code", user.getColorCode());
            response.put("answers", user.getAnswers());
            response.put("last_updated", user.getLastUpdated());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/api/chat-history")
    public ResponseEntity<?> getChatHistory(@RequestParam String email) {
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }
        try {
            Optional<ChatHistory> histOpt = chatHistoryRepository.findById(email.toLowerCase().trim());
            if (histOpt.isEmpty()) {
                return ResponseEntity.ok(Map.of("email", email, "messages", List.of()));
            }
            ChatHistory hist = histOpt.get();
            return ResponseEntity.ok(Map.of(
                    "email", hist.getEmail(),
                    "messages", hist.getMessages(),
                    "last_updated", hist.getLastUpdated()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
