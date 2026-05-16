package com.stresschecker.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class GroqChatService {

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String GROQ_MODEL = "llama-3.3-70b-versatile";
    
    private static final List<String> DEFAULT_RESPONSES = Arrays.asList(
            "I understand. Could you tell me more about that?",
            "I'm here to listen. What's on your mind?",
            "How has your sleep been lately?",
            "That sounds important. How does that make you feel?",
            "I'm keeping your stress context (%s) in mind. Is there something specific bothering you?");

    @Value("${groq.api.key:}")
    private String apiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public GroqChatService() {
        org.springframework.http.client.SimpleClientHttpRequestFactory factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(30000);
        factory.setReadTimeout(30000);
        this.restTemplate = new RestTemplate(factory);
    }

    public String getSmartLocalResponse(String userMessage, Map<String, Object> stressContext) {
        String msg = userMessage != null ? userMessage.toLowerCase() : "";
        String level = (String) stressContext.getOrDefault("level", "Unknown");
        Object scoreObj = stressContext.get("score");
        int score = scoreObj instanceof Number n ? n.intValue() : 0;
        String weeklyFocus = String.valueOf(stressContext.getOrDefault("weeklyFocus", ""));
        String profileType = String.valueOf(stressContext.getOrDefault("profileType", "your current profile"));

        if (containsAny(msg, "hello", "hi", "hey", "greetings")) {
            return "Hello there! I see your current stress level is " + level + " for your " + profileType
                    + " profile. How can I support you today?";
        }
        if (containsAny(msg, "tip", "manage", "help", "advice", "what to do")) {
            if (level.toLowerCase().contains("high")) {
                return "Since your stress is High, try the '4-7-8 Breathing': Inhale for 4s, hold for 7s, exhale for 8s. Do this 4 times.";
            } else if (level.toLowerCase().contains("medium")) {
                return "For moderate stress, a 15-minute quick walk or listening to instrumental music usually helps reset the mind.";
            } else {
                return "You're doing well! To maintain this, ensure you get 8 hours of sleep and stay hydrated.";
            }
        }
        if (containsAny(msg, "task", "plan", "weekly", "challenge")) {
            if (!weeklyFocus.isBlank() && !"null".equalsIgnoreCase(weeklyFocus)) {
                return "Your current weekly focus is: " + weeklyFocus
                        + " Start with the lightest challenge first so progress feels safe and doable.";
            }
            return "Let's keep it small today: one calming action, one practical action, and one enjoyable action is a strong reset.";
        }
        if (containsAny(msg, "bad", "sad", "anxious", "worried", "stress", "tired", "exhausted")) {
            return "I hear you. It's okay to feel this way. Remember, this is just a temporary phase. Have you taken a break recently?";
        }
        if (containsAny(msg, "analyze", "score", "result", "status")) {
            return "Based on your survey, your stress score is " + score + " which is considered " + level
                    + ". This isn't a diagnosis, just a snapshot of your current state.";
        }
        if (containsAny(msg, "thank", "bye", "goodbye", "ok", "okay")) {
            return "You're welcome! Take care of yourself. I'm here if you need me again.";
        }

        int idx = new Random().nextInt(DEFAULT_RESPONSES.size());
        String def = DEFAULT_RESPONSES.get(idx);
        if (def.contains("%s")) {
            def = String.format(def, level);
        }
        return def;
    }

    private static boolean containsAny(String msg, String... words) {
        if (msg == null) return false;
        for (String w : words) {
            if (msg.contains(w))
                return true;
        }
        return false;
    }

    public String getAiResponse(String userMessage, Map<String, Object> stressContext,
            List<Map<String, String>> history) {
        if (apiKey == null || apiKey.isBlank()) {
            System.err.println("[Groq] No API key found.");
            return getSmartLocalResponse(userMessage, stressContext);
        }

        String level = String.valueOf(stressContext.getOrDefault("level", "Unknown"));
        Object scoreObj = stressContext.get("score");
        int score = scoreObj instanceof Number n ? n.intValue() : 0;
        
        String profileType = String.valueOf(stressContext.getOrDefault("profileType", "general"));
        String weeklyFocus = String.valueOf(stressContext.getOrDefault("weeklyFocus", "Provide simple next steps."));
        Object triggersObj = stressContext.get("topTriggers");
        String topTriggers = triggersObj instanceof Collection<?> coll
                ? String.join(", ", coll.stream().map(String::valueOf).toList())
                : String.valueOf(triggersObj != null ? triggersObj : "");

        String systemText = String.format("""
                Act as a compassionate, intelligent mental health coach.

                USER PROFILE:
                - Current Stress Level: %s
                - Stress Score: %d
                - Profile Type: %s
                - Weekly Focus: %s
                - Top Triggers: %s

                Guidelines:
                1. Reply naturally to the user's latest message.
                2. Use the profile data to personalize advice.
                3. Keep it concise (max 3 sentences).
                4. Never present yourself as a doctor or diagnosis tool.
                """, level, score, profileType, weeklyFocus, topTriggers);

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemText));

        if (history != null) {
            for (Map<String, String> turn : history) {
                if (turn == null) continue;
                String roleRaw = turn.get("role");
                String text = turn.get("text");
                if (text != null && !text.isBlank()) {
                    String role = "user".equals(roleRaw) ? "user" : "assistant";
                    messages.add(Map.of("role", role, "content", text));
                }
            }
        }

        if (userMessage != null && !userMessage.isBlank()) {
            messages.add(Map.of("role", "user", "content", userMessage));
        } else {
            return "I didn't receive a message. How can I help?";
        }

        Map<String, Object> body = new HashMap<>();
        body.put("model", GROQ_MODEL);
        body.put("messages", messages);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey.trim());
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            System.out.println("[Groq] Sending chat request...");
            ResponseEntity<String> response = restTemplate.exchange(GROQ_URL, HttpMethod.POST, entity, String.class);

            JsonNode root = objectMapper.readTree(response.getBody());
            if (root.has("choices") && root.get("choices").isArray() && root.get("choices").size() > 0) {
                return root.get("choices").get(0).get("message").get("content").asText();
            }
            throw new RuntimeException("No choices returned.");
        } catch (HttpStatusCodeException e) {
            System.err.println("[Groq] HTTP error " + e.getStatusCode().value() + ": " + e.getResponseBodyAsString());
            return getSmartLocalResponse(userMessage, stressContext);
        } catch (Exception e) {
            System.err.println("[Groq] Unknown error: " + e.getMessage());
            return getSmartLocalResponse(userMessage, stressContext);
        }
    }

    public List<Map<String, Object>> generateInsights(List<Map<String, Object>> detailedResponses) {
        if (apiKey == null || apiKey.isBlank()) {
            return buildFallbackInsights(detailedResponses);
        }

        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append(
                "Analyze the following stress assessment responses. For each Question-Answer pair, provide a 'short_insight' (max 2 sentences) explaining why this specific score fits the user's situation or offering a quick tip.\n\n");
        promptBuilder.append(
                "Return ONLY a JSON array of objects. Each object should have: 'question_index' (integer, 0-based), 'insight' (string).\n\n");
        promptBuilder.append("Responses:\n");

        for (int i = 0; i < detailedResponses.size(); i++) {
            Map<String, Object> resp = detailedResponses.get(i);
            promptBuilder.append(String.format("[%d] Q: %s | A: %s | Score: %s\n",
                    i, resp.get("question"), resp.get("answer"), resp.get("score")));
        }

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", "You are an expert psychologist. Provide helpful, empathetic insights for stress assessment results. Output JSON only."));
        messages.add(Map.of("role", "user", "content", promptBuilder.toString()));

        Map<String, Object> body = new HashMap<>();
        body.put("model", GROQ_MODEL);
        body.put("messages", messages);
        body.put("response_format", Map.of("type", "json_object"));

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey.trim());
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            System.out.println("[Groq] Sending insights request...");
            ResponseEntity<String> response = restTemplate.exchange(GROQ_URL, HttpMethod.POST, entity, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());

            if (root.has("choices") && root.get("choices").size() > 0) {
                String jsonText = root.get("choices").get(0).get("message").get("content").asText();
                JsonNode insightsNode = objectMapper.readTree(jsonText);
                JsonNode insightsArray = insightsNode;
                
                if (insightsNode.isObject()) {
                    Iterator<Map.Entry<String, JsonNode>> fields = insightsNode.fields();
                    while (fields.hasNext()) {
                        JsonNode val = fields.next().getValue();
                        if (val.isArray()) {
                            insightsArray = val;
                            break;
                        }
                    }
                }

                List<Map<String, Object>> result = new ArrayList<>();
                for (int i = 0; i < detailedResponses.size(); i++) {
                    Map<String, Object> original = new HashMap<>(detailedResponses.get(i));
                    String insight = "General stress factor.";

                    if (insightsArray.isArray()) {
                        for (JsonNode node : insightsArray) {
                            if (node.has("question_index") && node.get("question_index").asInt() == i) {
                                insight = node.get("insight").asText();
                                break;
                            }
                        }
                    }
                    original.put("insight", insight);
                    result.add(original);
                }
                return result;
            }
        } catch (Exception e) {
            System.err.println("[Groq] Insights error: " + e.getMessage());
        }
        return buildFallbackInsights(detailedResponses);
    }

    public List<Map<String, Object>> searchArticles(String query, String profileType) {
        if (apiKey == null || apiKey.isBlank()) {
            return Collections.emptyList();
        }

        String prompt = String.format("""
                Act as a specialized search engine for mental health and wellness. 
                Search query: "%s"
                Target audience profile: %s

                Find 5 relevant articles or stories. For each, provide:
                1. title: A catchy, professional title.
                2. summary: A brief 2-sentence summary.
                3. url: A plausible real-world URL (e.g., from Psychology Today, Calm, or Harvard Health).
                4. source: The name of the source.

                Return ONLY a JSON array of objects.
                """, query, profileType);

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", "You are a wellness content curator. Output JSON only."));
        messages.add(Map.of("role", "user", "content", prompt));

        Map<String, Object> body = new HashMap<>();
        body.put("model", GROQ_MODEL);
        body.put("messages", messages);
        body.put("response_format", Map.of("type", "json_object"));

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey.trim());
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            System.out.println("[Groq] Sending article search request...");
            ResponseEntity<String> response = restTemplate.exchange(GROQ_URL, HttpMethod.POST, entity, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());

            if (root.has("choices") && root.get("choices").size() > 0) {
                String jsonText = root.get("choices").get(0).get("message").get("content").asText();
                JsonNode resultNode = objectMapper.readTree(jsonText);
                JsonNode articlesArray = resultNode;

                if (resultNode.isObject()) {
                    Iterator<Map.Entry<String, JsonNode>> fields = resultNode.fields();
                    while (fields.hasNext()) {
                        JsonNode val = fields.next().getValue();
                        if (val.isArray()) {
                            articlesArray = val;
                            break;
                        }
                    }
                }

                List<Map<String, Object>> result = new ArrayList<>();
                if (articlesArray.isArray()) {
                    int id = 1000;
                    for (JsonNode node : articlesArray) {
                        Map<String, Object> article = new HashMap<>();
                        article.put("id", id++);
                        article.put("title", node.path("title").asText("Insightful Article"));
                        article.put("summary", node.path("summary").asText("Read more about wellness."));
                        article.put("url", node.path("url").asText("#"));
                        article.put("source", node.path("source").asText("Wellness Guide"));
                        article.put("image", "https://images.unsplash.com/photo-1499209974431-9dac3adaf471?w=800&auto=format&fit=crop&q=60");
                        result.add(article);
                    }
                }
                return result;
            }
        } catch (Exception e) {
            System.err.println("[Groq] Search error: " + e.getMessage());
        }
        return Collections.emptyList();
    }

    private List<Map<String, Object>> buildFallbackInsights(List<Map<String, Object>> detailedResponses) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> response : detailedResponses) {
            Map<String, Object> enriched = new HashMap<>(response);
            int score = 0;
            Object scoreObj = response.get("score");
            if (scoreObj instanceof Number number) {
                score = number.intValue();
            }

            String insight;
            if (score >= 3) {
                insight = "This looks like a strong strain signal. Keep your next step very small and consider real-world support if it stays intense.";
            } else if (score == 2) {
                insight = "This area is draining more energy than it should. Pair one calming action with one practical boundary this week.";
            } else if (score == 1) {
                insight = "There is some pressure here, but it still looks workable. A small reset can stop it from compounding.";
            } else {
                insight = "This answer looks relatively steady right now. Protect the routine that is helping you stay balanced here.";
            }

            enriched.put("insight", insight);
            result.add(enriched);
        }
        return result;
    }
}
