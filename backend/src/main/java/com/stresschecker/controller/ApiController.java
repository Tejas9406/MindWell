package com.stresschecker.controller;

import com.stresschecker.model.*;
import com.stresschecker.repository.UserDataRepository;
import com.stresschecker.repository.ChatHistoryRepository;
import com.stresschecker.service.GeminiChatService;
import com.stresschecker.service.SheetsSyncService;
import com.stresschecker.service.FreesoundService;
import com.stresschecker.service.WellnessEngineService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;

import java.util.*;

@RestController
public class ApiController {

    private final FreesoundService freesoundService;
    private final SheetsSyncService sheetsSyncService;
    private final GeminiChatService geminiChatService;
    private final UserDataRepository userDataRepository;
    private final ChatHistoryRepository chatHistoryRepository;
    private final WellnessEngineService wellnessEngineService;

    private static final int MAX_HISTORY_TURNS = 20;

    public ApiController(SheetsSyncService sheetsSyncService, GeminiChatService geminiChatService,
            UserDataRepository userDataRepository, FreesoundService freesoundService,
            ChatHistoryRepository chatHistoryRepository, WellnessEngineService wellnessEngineService) {
        this.sheetsSyncService = sheetsSyncService;
        this.geminiChatService = geminiChatService;
        this.userDataRepository = userDataRepository;
        this.freesoundService = freesoundService;
        this.chatHistoryRepository = chatHistoryRepository;
        this.wellnessEngineService = wellnessEngineService;
    }

    @GetMapping("/")
    public Map<String, String> home() {
        return Map.of(
                "status", "healthy",
                "message", "Digital wellness API is running");
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

    @GetMapping("/api/assessment/profiles")
    public List<Map<String, String>> getAssessmentProfiles() {
        return wellnessEngineService.getSupportedProfiles();
    }

    @GetMapping("/api/assessment/template")
    public ResponseEntity<?> getAssessmentTemplate(@RequestParam(required = false) String profileType) {
        return ResponseEntity.ok(wellnessEngineService.getAssessmentTemplate(profileType));
    }

    @PostMapping("/api/assessment/submit")
    public ResponseEntity<?> submitAssessment(@RequestBody AssessmentSubmitRequest request) {
        String email = request.getEmail();
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }

        try {
            Optional<UserData> existing = userDataRepository.findById(email.toLowerCase().trim());
            UserData user = wellnessEngineService.createOrUpdateAssessment(request, existing.orElse(null));
            userDataRepository.save(user);
            return ResponseEntity.ok(buildUserResponse(user));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to submit assessment: " + e.getMessage()));
        }
    }

    @PostMapping("/api/weekly-plan/task")
    public ResponseEntity<?> updateWeeklyTask(@RequestBody WeeklyTaskUpdateRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }
        if (request.getTaskId() == null || request.getTaskId().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Task id is required"));
        }

        try {
            Optional<UserData> userOpt = userDataRepository.findById(request.getEmail().toLowerCase().trim());
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
            }

            UserData user = wellnessEngineService.updateWeeklyTaskState(
                    userOpt.get(),
                    request.getTaskId(),
                    request.isCompleted());
            userDataRepository.save(user);
            return ResponseEntity.ok(buildUserResponse(user));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update weekly task: " + e.getMessage()));
        }
    }

    @PostMapping("/api/weekly-plan/regenerate")
    public ResponseEntity<?> regenerateWeeklyPlan(@RequestBody WeeklyPlanRefreshRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }

        try {
            Optional<UserData> userOpt = userDataRepository.findById(request.getEmail().toLowerCase().trim());
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
            }

            UserData user = wellnessEngineService.regenerateWeeklyPlan(userOpt.get());
            userDataRepository.save(user);
            return ResponseEntity.ok(buildUserResponse(user));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to regenerate weekly plan: " + e.getMessage()));
        }
    }

    @PostMapping("/api/weekly-plan/check-in")
    public ResponseEntity<?> addWeeklyCheckIn(@RequestBody WeeklyCheckInRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }

        try {
            Optional<UserData> userOpt = userDataRepository.findById(request.getEmail().toLowerCase().trim());
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
            }

            UserData user = wellnessEngineService.addWeeklyCheckIn(
                    userOpt.get(),
                    request.getMood(),
                    request.getEnergy(),
                    request.getNote());
            userDataRepository.save(user);
            return ResponseEntity.ok(buildUserResponse(user));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to save weekly check-in: " + e.getMessage()));
        }
    }

    @PostMapping("/api/chat")
    public ResponseEntity<?> chat(@RequestBody ChatRequest request) {
        String userMessage = request.getMessage();
        String userEmailRaw = request.getEmail();
        String userEmail = (userEmailRaw != null && !userEmailRaw.isBlank()) ? userEmailRaw.toLowerCase().trim() : null;

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
                    stressContext.put("profileType", user.getProfileType());
                    stressContext.put("weeklyFocus", user.getWeeklyFocus());
                    stressContext.put("topTriggers", user.getTopTriggers());
                    stressContext.put("supportStyle", user.getSupportStyle());
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
                    history = new ArrayList<>(chatHistory.getMessages());
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



    @GetMapping(value = "/api/dream-image", produces = MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<byte[]> generateDreamImage(@RequestParam String prompt) {
        if (prompt == null || prompt.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        try {
            String encodedPrompt = java.net.URLEncoder.encode(
                "surreal cinematic dream visualization of " + prompt, java.nio.charset.StandardCharsets.UTF_8);
            String url = "https://image.pollinations.ai/prompt/" + encodedPrompt + "?width=768&height=512&nologo=true&seed=" + System.currentTimeMillis();

            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<byte[]> response = restTemplate.getForEntity(url, byte[].class);

            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_JPEG)
                    .body(response.getBody());
        } catch (Exception e) {
            System.err.println("Error calling Pollinations.ai: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
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
    public List<ArticleItem> getArticles(@RequestParam(required = false) String email,
            @RequestParam(required = false) String profileType) {
        UserData user = null;
        if (email != null && !email.isBlank()) {
            user = userDataRepository.findById(email.toLowerCase().trim()).orElse(null);
        }
        return wellnessEngineService.getRecommendedArticles(user, profileType);
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
            return ResponseEntity.ok(buildUserResponse(userOpt.get()));
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

    private Map<String, Object> buildUserResponse(UserData user) {
        wellnessEngineService.ensureWeeklyPlanState(user);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("email", user.getEmail());
        response.put("profile_type", user.getProfileType());
        response.put("support_style", user.getSupportStyle());
        response.put("sleep_quality", user.getSleepQuality());
        response.put("energy_level", user.getEnergyLevel());
        response.put("available_minutes", user.getAvailableMinutes());
        response.put("stress_level", user.getStressLevel());
        response.put("total_score", user.getTotalScore());
        response.put("color_code", user.getColorCode());
        response.put("answers", user.getAnswers());
        response.put("dimension_scores", user.getDimensionScores() != null ? user.getDimensionScores() : Map.of());
        response.put("dimension_breakdown",
                user.getDimensionBreakdown() != null ? user.getDimensionBreakdown() : List.of());
        response.put("top_triggers", user.getTopTriggers() != null ? user.getTopTriggers() : List.of());
        response.put("strengths", user.getStrengths() != null ? user.getStrengths() : List.of());
        response.put("summary", user.getSummary());
        response.put("weekly_focus", user.getWeeklyFocus());
        response.put("wellness_signals", user.getWellnessSignals() != null ? user.getWellnessSignals() : Map.of());
        response.put("weekly_challenges", wellnessEngineService.buildWeeklyChallengesWithProgress(user));
        response.put("challenge_milestones",
                user.getChallengeMilestones() != null ? user.getChallengeMilestones() : List.of());
        response.put("rescue_plan", user.getRescuePlan() != null ? user.getRescuePlan() : List.of());
        response.put("weekly_plan_progress",
                user.getWeeklyPlanProgress() != null ? user.getWeeklyPlanProgress() : Map.of());
        response.put("weekly_plan_meta",
                user.getWeeklyPlanMeta() != null ? user.getWeeklyPlanMeta() : Map.of());
        response.put("weekly_plan_summary", wellnessEngineService.buildWeeklyPlanSummary(user));
        response.put("weekly_check_ins",
                user.getWeeklyCheckIns() != null ? user.getWeeklyCheckIns() : List.of());
        response.put("detailed_responses",
                user.getDetailedResponses() != null ? user.getDetailedResponses() : List.of());
        response.put("last_updated", user.getLastUpdated());
        return response;
    }
}
