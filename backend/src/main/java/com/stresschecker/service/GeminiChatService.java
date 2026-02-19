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
public class GeminiChatService {

    private static final String GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
    private static final List<String> DEFAULT_RESPONSES = Arrays.asList(
            "I understand. Could you tell me more about that?",
            "I'm here to listen. What's on your mind?",
            "How has your sleep been lately?",
            "That sounds important. How does that make you feel?",
            "I'm keeping your stress context (%s) in mind. Is there something specific bothering you?");

    @Value("${gemini.api.key:}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String getSmartLocalResponse(String userMessage, Map<String, Object> stressContext) {
        String msg = userMessage.toLowerCase();
        String level = (String) stressContext.getOrDefault("level", "Unknown");
        Object scoreObj = stressContext.get("score");
        int score = scoreObj != null ? ((Number) scoreObj).intValue() : 0;

        if (containsAny(msg, "hello", "hi", "hey", "greetings")) {
            return "Hello there! I see your current stress level is " + level + ". How can I help you relax today?";
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
        for (String w : words) {
            if (msg.contains(w))
                return true;
        }
        return false;
    }

    public String getAiResponse(String userMessage, Map<String, Object> stressContext,
            List<Map<String, String>> history) {
        if (apiKey == null || apiKey.isBlank()) {
            return getSmartLocalResponse(userMessage, stressContext);
        }

        String level = String.valueOf(stressContext.getOrDefault("level", "Unknown"));
        Object scoreObj = stressContext.get("score");
        int score = scoreObj != null ? ((Number) scoreObj).intValue() : 0;

        String systemText = String.format("""
                Act as a compassionate, intelligent mental health coach.

                USER PROFILE:
                - Current Stress Level: %s
                - Stress Score: %d

                Guidelines:
                1. Reply naturally to the user's latest message.
                2. Use the profile data to personalize advice.
                3. Keep it concise (max 3 sentences).
                """, level, score);

        Map<String, Object> systemInstruction = Map.of(
                "parts", List.of(Map.of("text", systemText)));

        List<Map<String, Object>> contents = new ArrayList<>();

        for (Map<String, String> turn : history) {
            String role = "user".equals(turn.get("role")) ? "user" : "model";
            contents.add(Map.of(
                    "role", role,
                    "parts", List.of(Map.of("text", turn.get("text")))));
        }

        contents.add(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", userMessage))));

        Map<String, Object> body = new HashMap<>();
        body.put("system_instruction", systemInstruction);
        body.put("contents", contents);

        int maxRetries = 3;
        int baseDelay = 2000;

        for (int attempt = 0; attempt < maxRetries; attempt++) {
            try {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
                String url = GEMINI_URL + "?key=" + apiKey;

                ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

                JsonNode root = objectMapper.readTree(response.getBody());
                if (root.has("candidates") && root.get("candidates").isArray() && root.get("candidates").size() > 0) {
                    return root.get("candidates").get(0).get("content").get("parts").get(0).get("text").asText();
                }
                throw new RuntimeException("No candidates returned. Response: " + response.getBody());
            } catch (HttpStatusCodeException e) {
                if (e.getStatusCode().value() == 429 && attempt < maxRetries - 1) {
                    try {
                        Thread.sleep(baseDelay);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                    baseDelay *= 2;
                    continue;
                }
                return getSmartLocalResponse(userMessage, stressContext);
            } catch (Exception e) {
                e.printStackTrace();
                return getSmartLocalResponse(userMessage, stressContext);
            }
        }
        return getSmartLocalResponse(userMessage, stressContext);
    }

    public List<Map<String, Object>> generateInsights(List<Map<String, Object>> detailedResponses) {
        if (apiKey == null || apiKey.isBlank()) {
            return detailedResponses; // Return as is if no API key
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

        Map<String, Object> systemInstruction = Map.of(
                "parts", List.of(Map.of("text",
                        "You are an expert psychologist. Provide helpful, empathetic insights for stress assessment results. Output JSON only.")));

        Map<String, Object> userContent = Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", promptBuilder.toString())));

        Map<String, Object> body = new HashMap<>();
        body.put("system_instruction", systemInstruction);
        body.put("contents", List.of(userContent));

        body.put("generationConfig", Map.of("response_mime_type", "application/json"));

        int maxRetries = 3;
        for (int attempt = 0; attempt < maxRetries; attempt++) {
            try {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
                String url = GEMINI_URL + "?key=" + apiKey;

                ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
                JsonNode root = objectMapper.readTree(response.getBody());

                if (root.has("candidates") && root.get("candidates").size() > 0) {
                    String jsonText = root.get("candidates").get(0).get("content").get("parts").get(0).get("text")
                            .asText();

                    // Clean markdown code blocks if present
                    if (jsonText.startsWith("```json")) {
                        jsonText = jsonText.substring(7);
                        if (jsonText.endsWith("```")) {
                            jsonText = jsonText.substring(0, jsonText.length() - 3);
                        }
                    } else if (jsonText.startsWith("```")) {
                        jsonText = jsonText.substring(3);
                        if (jsonText.endsWith("```")) {
                            jsonText = jsonText.substring(0, jsonText.length() - 3);
                        }
                    }

                    JsonNode insightsArray = objectMapper.readTree(jsonText);

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
                e.printStackTrace();
            }
        }
        return detailedResponses;
    }
}
