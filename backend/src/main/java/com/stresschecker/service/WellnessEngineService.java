package com.stresschecker.service;

import com.stresschecker.model.ArticleItem;
import com.stresschecker.model.AssessmentAnswerRequest;
import com.stresschecker.model.AssessmentSubmitRequest;
import com.stresschecker.model.UserData;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class WellnessEngineService {

    private final List<QuestionDef> coreQuestions = new ArrayList<>();
    private final Map<String, ProfileBlueprint> profiles = new LinkedHashMap<>();
    private final Map<String, String> dimensionLabels = new LinkedHashMap<>();
    private final Map<String, String> dimensionStrengthHints = new HashMap<>();
    private final Map<String, ChallengeCategory> challengeCategories = new LinkedHashMap<>();
    private final List<TaskTemplate> taskLibrary = new ArrayList<>();
    private final List<ArticleTemplate> articleLibrary = new ArrayList<>();

    public WellnessEngineService() {
        initDimensions();
        initCategories();
        initQuestions();
        initTasks();
        initArticles();
    }

    public List<Map<String, String>> getSupportedProfiles() {
        List<Map<String, String>> results = new ArrayList<>();
        for (ProfileBlueprint profile : profiles.values()) {
            Map<String, String> item = new LinkedHashMap<>();
            item.put("key", profile.key());
            item.put("label", profile.label());
            item.put("description", profile.description());
            item.put("tone", profile.tone());
            results.add(item);
        }
        return results;
    }

    public Map<String, Object> getAssessmentTemplate(String profileType) {
        ProfileBlueprint profile = resolveProfile(profileType);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("profile_type", profile.key());
        response.put("profile_label", profile.label());
        response.put("description", profile.description());
        response.put("tone", profile.tone());
        response.put("estimated_minutes", 6);
        response.put("question_count", getQuestionsForProfile(profile.key()).size());
        response.put("challenge_categories", buildChallengeCategoryResponse());
        response.put("questions", buildQuestionResponse(getQuestionsForProfile(profile.key())));
        return response;
    }

    public UserData createOrUpdateAssessment(AssessmentSubmitRequest request, UserData existing) {
        ProfileBlueprint profile = resolveProfile(request.getProfileType());
        List<QuestionDef> questions = getQuestionsForProfile(profile.key());
        Map<String, Integer> answerMap = normalizeAnswers(request.getAnswers());
        int availableMinutes = clampAvailableMinutes(request.getAvailableMinutes());
        String supportStyle = normalizeSupportStyle(request.getSupportStyle());
        String sleepQuality = normalizeSleepQuality(request.getSleepQuality());
        String energyLevel = normalizeEnergyLevel(request.getEnergyLevel());

        List<Long> rawAnswers = new ArrayList<>();
        List<Map<String, Object>> detailedResponses = new ArrayList<>();
        Map<String, List<Integer>> dimensionBuckets = new LinkedHashMap<>();

        int totalScore = 0;
        for (QuestionDef question : questions) {
            int value = clampAnswerValue(answerMap.getOrDefault(question.id(), 1));
            totalScore += value;
            rawAnswers.add((long) value);

            dimensionBuckets.computeIfAbsent(question.dimension(), key -> new ArrayList<>()).add(value);

            Map<String, Object> detail = new LinkedHashMap<>();
            detail.put("question_id", question.id());
            detail.put("question", question.prompt());
            detail.put("answer", labelForAnswer(value));
            detail.put("score", value);
            detail.put("dimension", question.dimension());
            detail.put("dimension_label", labelForDimension(question.dimension()));
            detailedResponses.add(detail);
        }

        Map<String, Integer> dimensionScores = buildDimensionScores(dimensionBuckets);
        List<Map<String, Object>> dimensionBreakdown = buildDimensionBreakdown(dimensionScores);
        List<String> topTriggers = buildTopTriggers(dimensionScores);
        List<String> strengths = buildStrengths(dimensionScores);

        int maxScore = questions.size() * 3;
        int percentage = maxScore == 0 ? 0 : Math.round((totalScore * 100f) / maxScore);
        String[] levelAndColor = determineStressLevel(percentage);
        String weeklyFocus = buildWeeklyFocus(topTriggers, profile);
        Map<String, Object> wellnessSignals = buildWellnessSignals(percentage, sleepQuality, energyLevel, dimensionScores);
        List<Map<String, Object>> weeklyChallenges = buildChallengeBoard(profile.key(), dimensionScores, percentage,
                energyLevel, sleepQuality, availableMinutes);

        UserData user = existing != null ? existing : new UserData();
        user.setEmail(normalizeEmail(request.getEmail()));
        user.setAnswers(rawAnswers);
        user.setTotalScore(totalScore);
        user.setStressLevel(levelAndColor[0]);
        user.setColorCode(levelAndColor[1]);
        user.setDetailedResponses(detailedResponses);
        user.setProfileType(profile.key());
        user.setSupportStyle(supportStyle);
        user.setSleepQuality(sleepQuality);
        user.setEnergyLevel(energyLevel);
        user.setAvailableMinutes(availableMinutes);
        user.setDimensionScores(dimensionScores);
        user.setDimensionBreakdown(dimensionBreakdown);
        user.setTopTriggers(topTriggers);
        user.setStrengths(strengths);
        user.setSummary(buildSummary(profile, levelAndColor[0], topTriggers, strengths, supportStyle));
        user.setWeeklyFocus(weeklyFocus);
        user.setWellnessSignals(wellnessSignals);
        user.setWeeklyChallenges(weeklyChallenges);
        user.setChallengeMilestones(buildChallengeMilestones());
        user.setRescuePlan(buildRescuePlan(dimensionScores, weeklyFocus));
        user.setWeeklyPlanProgress(createWeeklyPlanProgress(weeklyChallenges));
        user.setWeeklyPlanMeta(buildWeeklyPlanMeta());
        user.setWeeklyCheckIns(new ArrayList<>());
        user.setLastUpdated(new Date());
        return user;
    }

    public List<ArticleItem> getRecommendedArticles(UserData user, String profileType) {
        String normalizedProfile = normalizeProfileType(profileType);
        if (user != null && user.getProfileType() != null && !user.getProfileType().isBlank()) {
            normalizedProfile = user.getProfileType();
        }
        final String finalProfile = normalizedProfile;

        Set<String> primaryDimensions = new LinkedHashSet<>();
        if (user != null && user.getDimensionScores() != null) {
            primaryDimensions.addAll(user.getDimensionScores().entrySet().stream()
                    .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                    .limit(3)
                    .map(Map.Entry::getKey)
                    .collect(Collectors.toCollection(LinkedHashSet::new)));
        }

        List<ArticleTemplate> ranked = new ArrayList<>(articleLibrary);
        ranked.sort(Comparator
                .comparingInt((ArticleTemplate article) -> scoreArticle(article, finalProfile, primaryDimensions))
                .reversed());

        List<ArticleItem> items = new ArrayList<>();
        int id = 1;
        for (ArticleTemplate article : ranked.stream().limit(4).toList()) {
            items.add(new ArticleItem(
                    id++,
                    article.title(),
                    article.summary(),
                    article.url(),
                    article.image(),
                    article.source()));
        }
        return items;
    }

    public void ensureWeeklyPlanState(UserData user) {
        if (user == null) {
            return;
        }

        List<Map<String, Object>> weeklyChallenges = user.getWeeklyChallenges() != null
                ? user.getWeeklyChallenges()
                : new ArrayList<>();

        user.setWeeklyChallenges(weeklyChallenges);

        if (user.getWeeklyPlanProgress() == null || user.getWeeklyPlanProgress().isEmpty()) {
            user.setWeeklyPlanProgress(createWeeklyPlanProgress(weeklyChallenges));
        } else {
            user.setWeeklyPlanProgress(syncWeeklyPlanProgress(weeklyChallenges, user.getWeeklyPlanProgress()));
        }

        if (user.getWeeklyPlanMeta() == null || user.getWeeklyPlanMeta().isEmpty()) {
            user.setWeeklyPlanMeta(buildWeeklyPlanMeta());
        }

        if (user.getWeeklyCheckIns() == null) {
            user.setWeeklyCheckIns(new ArrayList<>());
        }

        if (user.getChallengeMilestones() == null || user.getChallengeMilestones().isEmpty()) {
            user.setChallengeMilestones(buildChallengeMilestones());
        }

        if (user.getRescuePlan() == null || user.getRescuePlan().isEmpty()) {
            user.setRescuePlan(buildRescuePlan(
                    user.getDimensionScores() != null ? user.getDimensionScores() : Map.of(),
                    user.getWeeklyFocus() != null ? user.getWeeklyFocus() : "Return to small, kind next steps."));
        }
    }

    public UserData updateWeeklyTaskState(UserData user, String taskId, boolean completed) {
        ensureWeeklyPlanState(user);
        if (user == null || taskId == null || taskId.isBlank()) {
            return user;
        }

        Map<String, Map<String, Object>> progress = new LinkedHashMap<>(user.getWeeklyPlanProgress());
        Map<String, Object> current = new LinkedHashMap<>(progress.getOrDefault(taskId, Map.of()));
        current.put("completed", completed);
        current.put("completed_at", completed ? new Date() : null);
        if (!current.containsKey("category_key")) {
            current.put("category_key", findTaskCategoryKey(user.getWeeklyChallenges(), taskId));
        }
        progress.put(taskId, current);

        user.setWeeklyPlanProgress(progress);
        user.setLastUpdated(new Date());
        return user;
    }

    public UserData regenerateWeeklyPlan(UserData user) {
        ensureWeeklyPlanState(user);
        if (user == null) {
            return null;
        }

        String profileType = normalizeProfileType(user.getProfileType());
        Map<String, Integer> dimensionScores = user.getDimensionScores() != null
                ? user.getDimensionScores()
                : Map.of();

        int maxScore = user.getAnswers() != null && !user.getAnswers().isEmpty() ? user.getAnswers().size() * 3 : 48;
        int totalPercentage = maxScore == 0 ? 0 : Math.round((user.getTotalScore() * 100f) / maxScore);

        List<Map<String, Object>> weeklyChallenges = buildChallengeBoard(
                profileType,
                dimensionScores,
                totalPercentage,
                normalizeEnergyLevel(user.getEnergyLevel()),
                normalizeSleepQuality(user.getSleepQuality()),
                clampAvailableMinutes(user.getAvailableMinutes()));

        ProfileBlueprint profile = resolveProfile(profileType);
        String weeklyFocus = buildWeeklyFocus(user.getTopTriggers() != null ? user.getTopTriggers() : List.of(), profile);

        user.setWeeklyChallenges(weeklyChallenges);
        user.setChallengeMilestones(buildChallengeMilestones());
        user.setWeeklyFocus(weeklyFocus);
        user.setRescuePlan(buildRescuePlan(dimensionScores, weeklyFocus));
        user.setWeeklyPlanProgress(createWeeklyPlanProgress(weeklyChallenges));
        user.setWeeklyPlanMeta(buildWeeklyPlanMeta());
        user.setLastUpdated(new Date());
        return user;
    }

    public UserData addWeeklyCheckIn(UserData user, String mood, String energy, String note) {
        ensureWeeklyPlanState(user);
        if (user == null) {
            return null;
        }

        List<Map<String, Object>> checkIns = new ArrayList<>(user.getWeeklyCheckIns());
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("created_at", new Date());
        item.put("mood", normalizeCheckInMood(mood));
        item.put("energy", normalizeCheckInEnergy(energy));
        item.put("note", sanitizeNote(note));
        checkIns.add(item);

        while (checkIns.size() > 7) {
            checkIns.remove(0);
        }

        user.setWeeklyCheckIns(checkIns);
        user.setLastUpdated(new Date());
        return user;
    }

    public List<Map<String, Object>> buildWeeklyChallengesWithProgress(UserData user) {
        ensureWeeklyPlanState(user);
        if (user == null || user.getWeeklyChallenges() == null) {
            return List.of();
        }

        Map<String, Map<String, Object>> progress = user.getWeeklyPlanProgress();
        List<Map<String, Object>> items = new ArrayList<>();

        for (Map<String, Object> category : user.getWeeklyChallenges()) {
            Map<String, Object> categoryCopy = new LinkedHashMap<>(category);
            List<Map<String, Object>> taskCopies = new ArrayList<>();
            for (Map<String, Object> task : getTaskMaps(category)) {
                Map<String, Object> taskCopy = new LinkedHashMap<>(task);
                String taskId = String.valueOf(task.getOrDefault("id", ""));
                Map<String, Object> taskProgress = progress.getOrDefault(taskId, Map.of());
                taskCopy.put("completed", asBoolean(taskProgress.get("completed")));
                taskCopy.put("completed_at", taskProgress.get("completed_at"));
                taskCopies.add(taskCopy);
            }
            categoryCopy.put("tasks", taskCopies);
            items.add(categoryCopy);
        }

        return items;
    }

    public Map<String, Object> buildWeeklyPlanSummary(UserData user) {
        ensureWeeklyPlanState(user);
        if (user == null) {
            return Map.of();
        }

        List<Map<String, Object>> challenges = buildWeeklyChallengesWithProgress(user);
        Map<String, Map<String, Object>> progress = user.getWeeklyPlanProgress();

        int totalTaskCount = challenges.stream()
                .mapToInt(category -> getTaskMaps(category).size())
                .sum();

        int completedTaskCount = (int) progress.values().stream()
                .filter(item -> asBoolean(item.get("completed")))
                .count();

        int completedCategoryCount = (int) challenges.stream()
                .filter(category -> !getTaskMaps(category).isEmpty()
                        && getTaskMaps(category).stream()
                                .allMatch(task -> asBoolean(task.get("completed"))))
                .count();

        int completionRate = totalTaskCount == 0 ? 0 : Math.round((completedTaskCount * 100f) / totalTaskCount);
        int todayCompletedCount = (int) progress.values().stream()
                .filter(item -> isCompletedToday(item.get("completed_at")))
                .count();

        List<Map<String, Object>> nextUp = new ArrayList<>();
        for (Map<String, Object> category : challenges) {
            for (Map<String, Object> task : getTaskMaps(category)) {
                if (!asBoolean(task.get("completed")) && nextUp.size() < 3) {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", task.get("id"));
                    item.put("title", task.get("title"));
                    item.put("minutes", task.get("minutes"));
                    item.put("intensity", task.get("intensity"));
                    item.put("category_label", category.get("label"));
                    item.put("reason", task.get("reason"));
                    nextUp.add(item);
                }
            }
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("total_task_count", totalTaskCount);
        summary.put("completed_task_count", completedTaskCount);
        summary.put("completed_category_count", completedCategoryCount);
        summary.put("completion_rate", completionRate);
        summary.put("today_completed_count", todayCompletedCount);
        summary.put("streak_days", calculateCurrentStreakDays(progress));
        summary.put("next_up", nextUp);
        summary.put("check_in_count", user.getWeeklyCheckIns() != null ? user.getWeeklyCheckIns().size() : 0);
        summary.put("week_label", String.valueOf(user.getWeeklyPlanMeta().getOrDefault("week_label", "")));
        return summary;
    }

    private int scoreArticle(ArticleTemplate article, String profileType, Set<String> primaryDimensions) {
        int score = 0;
        if (article.profiles().contains("all") || article.profiles().contains(profileType)) {
            score += 3;
        }
        for (String dimension : article.dimensions()) {
            if (primaryDimensions.contains(dimension)) {
                score += 2;
            }
        }
        return score;
    }

    private Map<String, Integer> normalizeAnswers(List<AssessmentAnswerRequest> answers) {
        Map<String, Integer> normalized = new HashMap<>();
        if (answers == null) {
            return normalized;
        }
        for (AssessmentAnswerRequest answer : answers) {
            if (answer == null || answer.getQuestionId() == null) {
                continue;
            }
            normalized.put(answer.getQuestionId(), clampAnswerValue(answer.getValue()));
        }
        return normalized;
    }

    private int clampAnswerValue(int value) {
        return Math.max(0, Math.min(3, value));
    }

    private int clampAvailableMinutes(Integer availableMinutes) {
        if (availableMinutes == null) {
            return 15;
        }
        return Math.max(5, Math.min(45, availableMinutes));
    }

    private String normalizeSupportStyle(String value) {
        String normalized = value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "direct", "coach", "straight" -> "Direct Coach";
            default -> "Gentle Guide";
        };
    }

    private String normalizeSleepQuality(String value) {
        String normalized = value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "poor", "restless", "bad" -> "Restless";
            case "okay", "average", "mixed" -> "Mixed";
            default -> "Recharging";
        };
    }

    private String normalizeEnergyLevel(String value) {
        String normalized = value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "high", "strong", "good" -> "High";
            case "mid", "medium", "steady" -> "Steady";
            default -> "Low";
        };
    }

    private String normalizeProfileType(String profileType) {
        if (profileType == null || profileType.isBlank()) {
            return "professional";
        }
        return profileType.trim().toLowerCase(Locale.ROOT).replace(' ', '_');
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private ProfileBlueprint resolveProfile(String profileType) {
        String normalized = normalizeProfileType(profileType);
        return profiles.getOrDefault(normalized, profiles.get("professional"));
    }

    private List<QuestionDef> getQuestionsForProfile(String profileType) {
        ProfileBlueprint profile = resolveProfile(profileType);
        List<QuestionDef> questions = new ArrayList<>(coreQuestions);
        questions.addAll(profile.questions());
        return questions;
    }

    private List<Map<String, Object>> buildQuestionResponse(List<QuestionDef> questions) {
        List<Map<String, Object>> response = new ArrayList<>();
        for (QuestionDef question : questions) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", question.id());
            item.put("prompt", question.prompt());
            item.put("dimension", question.dimension());
            item.put("dimension_label", labelForDimension(question.dimension()));
            item.put("helper_text", question.helperText());
            item.put("options", buildAnswerOptions());
            response.add(item);
        }
        return response;
    }

    private List<Map<String, Object>> buildAnswerOptions() {
        List<Map<String, Object>> options = new ArrayList<>();
        options.add(buildOption(0, "Rarely", "This is mostly under control"));
        options.add(buildOption(1, "Sometimes", "Shows up but stays manageable"));
        options.add(buildOption(2, "Often", "This is draining your week"));
        options.add(buildOption(3, "Almost always", "This needs care right now"));
        return options;
    }

    private Map<String, Object> buildOption(int value, String label, String detail) {
        Map<String, Object> option = new LinkedHashMap<>();
        option.put("value", value);
        option.put("label", label);
        option.put("detail", detail);
        return option;
    }

    private List<Map<String, Object>> buildChallengeCategoryResponse() {
        List<Map<String, Object>> items = new ArrayList<>();
        for (ChallengeCategory category : challengeCategories.values()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("key", category.key());
            item.put("label", category.label());
            item.put("objective", category.objective());
            items.add(item);
        }
        return items;
    }

    private Map<String, Integer> buildDimensionScores(Map<String, List<Integer>> dimensionBuckets) {
        Map<String, Integer> scores = new LinkedHashMap<>();
        for (Map.Entry<String, List<Integer>> entry : dimensionBuckets.entrySet()) {
            double average = entry.getValue().stream().mapToInt(Integer::intValue).average().orElse(0);
            int score = (int) Math.round((average / 3.0) * 100);
            scores.put(entry.getKey(), score);
        }
        return scores;
    }

    private List<Map<String, Object>> buildDimensionBreakdown(Map<String, Integer> dimensionScores) {
        List<Map<String, Object>> items = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : dimensionScores.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .toList()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("key", entry.getKey());
            item.put("label", labelForDimension(entry.getKey()));
            item.put("score", entry.getValue());
            item.put("severity", severityLabel(entry.getValue()));
            item.put("accent", severityAccent(entry.getValue()));
            item.put("insight", insightForDimension(entry.getKey(), entry.getValue()));
            items.add(item);
        }
        return items;
    }

    private List<String> buildTopTriggers(Map<String, Integer> dimensionScores) {
        List<String> triggers = dimensionScores.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(3)
                .map(entry -> labelForDimension(entry.getKey()))
                .collect(Collectors.toList());

        if (triggers.isEmpty()) {
            return List.of("Daily pressure");
        }
        return triggers;
    }

    private List<String> buildStrengths(Map<String, Integer> dimensionScores) {
        List<String> strengths = dimensionScores.entrySet().stream()
                .sorted(Map.Entry.comparingByValue())
                .limit(2)
                .map(entry -> dimensionStrengthHints.getOrDefault(entry.getKey(), "You still respond to structure and small wins."))
                .collect(Collectors.toList());

        if (strengths.isEmpty()) {
            return List.of("You are still engaging with support, which is a strong recovery sign.");
        }
        return strengths;
    }

    private String buildWeeklyFocus(List<String> topTriggers, ProfileBlueprint profile) {
        String dominantTrigger = topTriggers.isEmpty() ? "steady recovery" : topTriggers.get(0).toLowerCase(Locale.ROOT);
        return "This week, protect your " + dominantTrigger + " and keep your " + profile.label().toLowerCase(Locale.ROOT)
                + " routine small, consistent, and realistic.";
    }

    private Map<String, Object> buildWellnessSignals(int percentage, String sleepQuality, String energyLevel,
            Map<String, Integer> dimensionScores) {
        Map<String, Object> signals = new LinkedHashMap<>();
        signals.put("mental_weather", percentage >= 70 ? "Stormy" : percentage >= 45 ? "Cloudy" : "Clear");
        signals.put("energy_band", energyLevel);
        signals.put("sleep_debt",
                "Restless".equalsIgnoreCase(sleepQuality) ? "High"
                        : "Mixed".equalsIgnoreCase(sleepQuality) ? "Moderate" : "Light");

        int socialScore = dimensionScores.getOrDefault("social_battery", 40);
        signals.put("social_battery", socialScore >= 70 ? "Low" : socialScore >= 45 ? "Medium" : "Warm");
        return signals;
    }

    private String buildSummary(ProfileBlueprint profile, String stressLevel, List<String> topTriggers,
            List<String> strengths, String supportStyle) {
        String triggerSummary = topTriggers.stream().limit(2).collect(Collectors.joining(" and "));
        String strengthSummary = strengths.isEmpty() ? "you still respond to supportive structure"
                : strengths.get(0).toLowerCase(Locale.ROOT);

        return "For your " + profile.label().toLowerCase(Locale.ROOT) + " profile, the current pattern looks like "
                + stressLevel.toLowerCase(Locale.ROOT) + ", shaped mostly by " + triggerSummary + ". The encouraging part is "
                + strengthSummary + ", so your " + supportStyle.toLowerCase(Locale.ROOT)
                + " plan should stay gentle, visible, and repeatable.";
    }

    private String[] determineStressLevel(int percentage) {
        if (percentage <= 33) {
            return new String[] { "Low Stress", "green" };
        }
        if (percentage <= 66) {
            return new String[] { "Medium Stress", "yellow" };
        }
        return new String[] { "High Stress", "red" };
    }

    private String labelForAnswer(int value) {
        return switch (value) {
            case 0 -> "Rarely";
            case 1 -> "Sometimes";
            case 2 -> "Often";
            default -> "Almost always";
        };
    }

    private String labelForDimension(String key) {
        return dimensionLabels.getOrDefault(key, "Wellness");
    }

    private String severityLabel(int score) {
        if (score >= 70) {
            return "Needs Care";
        }
        if (score >= 45) {
            return "Watch Zone";
        }
        return "Steady";
    }

    private String severityAccent(int score) {
        if (score >= 70) {
            return "coral";
        }
        if (score >= 45) {
            return "amber";
        }
        return "teal";
    }

    private String insightForDimension(String dimension, int score) {
        String prefix = labelForDimension(dimension);
        if (score >= 70) {
            return prefix + " is asking for smaller tasks, stronger boundaries, and faster recovery loops.";
        }
        if (score >= 45) {
            return prefix + " is manageable, but it should guide this week's priorities.";
        }
        return prefix + " is currently acting like a support pillar for recovery.";
    }

    private List<Map<String, Object>> buildChallengeBoard(String profileType, Map<String, Integer> dimensionScores,
            int totalPercentage, String energyLevel, String sleepQuality, int availableMinutes) {
        List<Map<String, Object>> board = new ArrayList<>();
        for (ChallengeCategory category : challengeCategories.values()) {
            List<TaskTemplate> ranked = taskLibrary.stream()
                    .filter(task -> task.categoryKey().equals(category.key()))
                    .sorted(Comparator
                            .comparingInt((TaskTemplate task) -> scoreTask(task, profileType, dimensionScores,
                                    totalPercentage, energyLevel, sleepQuality, availableMinutes))
                            .reversed()
                            .thenComparingInt(TaskTemplate::minutes))
                    .toList();

            List<Map<String, Object>> taskMaps = new ArrayList<>();
            for (TaskTemplate task : ranked) {
                if (taskMaps.size() >= 2) {
                    break;
                }
                taskMaps.add(buildTaskMap(task, dimensionScores));
            }

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("key", category.key());
            item.put("label", category.label());
            item.put("objective", category.objective());
            item.put("tasks", taskMaps);
            board.add(item);
        }
        return board;
    }

    private int scoreTask(TaskTemplate task, String profileType, Map<String, Integer> dimensionScores,
            int totalPercentage, String energyLevel, String sleepQuality, int availableMinutes) {
        int score = 0;

        if (task.profiles().contains("all") || task.profiles().contains(profileType)) {
            score += 6;
        }

        for (String dimension : task.focusDimensions()) {
            score += dimensionScores.getOrDefault(dimension, 35) / 10;
        }

        if ("Low".equalsIgnoreCase(energyLevel) && task.lowEnergyFriendly()) {
            score += 5;
        }
        if ("Restless".equalsIgnoreCase(sleepQuality) && task.sleepFriendly()) {
            score += 4;
        }
        if (totalPercentage >= 70 && task.minutes() <= 10) {
            score += 4;
        }
        if (totalPercentage >= 70 && task.minutes() > 20) {
            score -= 4;
        }
        if (task.minutes() <= availableMinutes) {
            score += 2;
        }

        return score;
    }

    private Map<String, Object> buildTaskMap(TaskTemplate task, Map<String, Integer> dimensionScores) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", task.id());
        item.put("title", task.title());
        item.put("description", task.description());
        item.put("minutes", task.minutes());
        item.put("reason", buildTaskReason(task, dimensionScores));
        item.put("intensity", task.minutes() <= 10 ? "Light" : task.minutes() <= 20 ? "Steady" : "Deep");
        return item;
    }

    private String buildTaskReason(TaskTemplate task, Map<String, Integer> dimensionScores) {
        String strongestDimension = task.focusDimensions().stream()
                .sorted((left, right) -> Integer.compare(
                        dimensionScores.getOrDefault(right, 35),
                        dimensionScores.getOrDefault(left, 35)))
                .findFirst()
                .orElse("mental_load");

        return "Chosen to support " + labelForDimension(strongestDimension).toLowerCase(Locale.ROOT) + ".";
    }

    private Map<String, Map<String, Object>> createWeeklyPlanProgress(List<Map<String, Object>> weeklyChallenges) {
        Map<String, Map<String, Object>> progress = new LinkedHashMap<>();
        for (Map<String, Object> category : weeklyChallenges) {
            String categoryKey = String.valueOf(category.getOrDefault("key", ""));
            for (Map<String, Object> task : getTaskMaps(category)) {
                String taskId = String.valueOf(task.getOrDefault("id", ""));
                if (taskId.isBlank()) {
                    continue;
                }
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("completed", false);
                item.put("completed_at", null);
                item.put("category_key", categoryKey);
                progress.put(taskId, item);
            }
        }
        return progress;
    }

    private Map<String, Map<String, Object>> syncWeeklyPlanProgress(List<Map<String, Object>> weeklyChallenges,
            Map<String, Map<String, Object>> existingProgress) {
        Map<String, Map<String, Object>> synced = createWeeklyPlanProgress(weeklyChallenges);
        for (Map.Entry<String, Map<String, Object>> entry : synced.entrySet()) {
            Map<String, Object> existing = existingProgress.get(entry.getKey());
            if (existing == null) {
                continue;
            }

            Map<String, Object> merged = new LinkedHashMap<>(entry.getValue());
            merged.put("completed", asBoolean(existing.get("completed")));
            merged.put("completed_at", existing.get("completed_at"));
            synced.put(entry.getKey(), merged);
        }
        return synced;
    }

    private Map<String, Object> buildWeeklyPlanMeta() {
        Date now = new Date();
        LocalDate localDate = Instant.ofEpochMilli(now.getTime()).atZone(ZoneId.systemDefault()).toLocalDate();

        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("generated_at", now);
        meta.put("week_key", localDate.with(java.time.DayOfWeek.MONDAY).toString());
        meta.put("week_label", "Week of " + localDate.format(DateTimeFormatter.ofPattern("dd MMM yyyy")));
        return meta;
    }

    private List<Map<String, Object>> getTaskMaps(Map<String, Object> category) {
        Object rawTasks = category.get("tasks");
        if (!(rawTasks instanceof Collection<?> rawCollection)) {
            return List.of();
        }

        List<Map<String, Object>> tasks = new ArrayList<>();
        for (Object item : rawCollection) {
            if (item instanceof Map<?, ?> rawMap) {
                Map<String, Object> task = new LinkedHashMap<>();
                for (Map.Entry<?, ?> entry : rawMap.entrySet()) {
                    task.put(String.valueOf(entry.getKey()), entry.getValue());
                }
                tasks.add(task);
            }
        }
        return tasks;
    }

    private String findTaskCategoryKey(List<Map<String, Object>> weeklyChallenges, String taskId) {
        if (weeklyChallenges == null || taskId == null) {
            return "";
        }
        for (Map<String, Object> category : weeklyChallenges) {
            for (Map<String, Object> task : getTaskMaps(category)) {
                if (taskId.equals(String.valueOf(task.getOrDefault("id", "")))) {
                    return String.valueOf(category.getOrDefault("key", ""));
                }
            }
        }
        return "";
    }

    private boolean asBoolean(Object value) {
        if (value instanceof Boolean boolValue) {
            return boolValue;
        }
        if (value instanceof String stringValue) {
            return Boolean.parseBoolean(stringValue);
        }
        return false;
    }

    private boolean isCompletedToday(Object completedAt) {
        if (!(completedAt instanceof Date date)) {
            return false;
        }
        LocalDate completionDate = Instant.ofEpochMilli(date.getTime()).atZone(ZoneId.systemDefault()).toLocalDate();
        return LocalDate.now(ZoneId.systemDefault()).equals(completionDate);
    }

    private int calculateCurrentStreakDays(Map<String, Map<String, Object>> progress) {
        Set<LocalDate> completionDays = progress.values().stream()
                .map(item -> item.get("completed_at"))
                .filter(Date.class::isInstance)
                .map(Date.class::cast)
                .map(date -> Instant.ofEpochMilli(date.getTime()).atZone(ZoneId.systemDefault()).toLocalDate())
                .collect(Collectors.toCollection(LinkedHashSet::new));

        int streak = 0;
        LocalDate current = LocalDate.now(ZoneId.systemDefault());
        while (completionDays.contains(current)) {
            streak++;
            current = current.minusDays(1);
        }
        return streak;
    }

    private String normalizeCheckInMood(String mood) {
        String normalized = mood == null ? "" : mood.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "heavy", "low", "rough" -> "Heavy";
            case "steady", "okay", "ok" -> "Steady";
            case "lighter", "good", "calm" -> "Lighter";
            default -> "Steady";
        };
    }

    private String normalizeCheckInEnergy(String energy) {
        String normalized = energy == null ? "" : energy.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "drained", "low" -> "Drained";
            case "steady", "okay", "ok" -> "Steady";
            case "strong", "high" -> "Strong";
            default -> "Steady";
        };
    }

    private String sanitizeNote(String note) {
        if (note == null) {
            return "";
        }
        String trimmed = note.trim();
        if (trimmed.length() <= 220) {
            return trimmed;
        }
        return trimmed.substring(0, 220);
    }

    private List<Map<String, Object>> buildChallengeMilestones() {
        List<Map<String, Object>> milestones = new ArrayList<>();
        milestones.add(buildMilestone("On The Right Track", "Finish both tasks in any 2 categories.", "starter"));
        milestones.add(buildMilestone("You Rock", "Finish both tasks in any 4 categories.", "builder"));
        milestones.add(buildMilestone("You Slayed It", "Finish both tasks in all 6 categories.", "legend"));
        return milestones;
    }

    private Map<String, Object> buildMilestone(String title, String description, String key) {
        Map<String, Object> milestone = new LinkedHashMap<>();
        milestone.put("key", key);
        milestone.put("title", title);
        milestone.put("description", description);
        return milestone;
    }

    private List<Map<String, Object>> buildRescuePlan(Map<String, Integer> dimensionScores, String weeklyFocus) {
        List<Map<String, Object>> steps = new ArrayList<>();
        steps.add(buildRescueStep("Slow the body", "Inhale for 4, exhale for 6, and repeat 5 times."));
        steps.add(buildRescueStep("Release tension", "Unclench jaw, drop shoulders, and plant both feet on the floor."));
        steps.add(buildRescueStep("Shrink the problem", "Choose one task under 10 minutes and ignore the rest for now."));
        steps.add(buildRescueStep("Return to the plan", weeklyFocus));

        if (dimensionScores.getOrDefault("sleep_recovery", 0) >= 70) {
            steps.set(2, buildRescueStep("Protect recovery", "Dim the screen, lower stimulation, and give yourself a short wind-down."));
        }
        return steps;
    }

    private Map<String, Object> buildRescueStep(String title, String description) {
        Map<String, Object> step = new LinkedHashMap<>();
        step.put("title", title);
        step.put("description", description);
        return step;
    }

    private void initDimensions() {
        dimensionLabels.put("mental_load", "Mental Load");
        dimensionLabels.put("emotional_strain", "Emotional Strain");
        dimensionLabels.put("sleep_recovery", "Sleep Recovery");
        dimensionLabels.put("focus_capacity", "Focus Capacity");
        dimensionLabels.put("joy_loss", "Joy Capacity");
        dimensionLabels.put("body_stress", "Body Stress");
        dimensionLabels.put("social_battery", "Social Battery");
        dimensionLabels.put("recovery_habits", "Recovery Habits");
        dimensionLabels.put("study_pressure", "Study Pressure");
        dimensionLabels.put("burnout_risk", "Burnout Risk");
        dimensionLabels.put("career_pressure", "Career Pressure");
        dimensionLabels.put("confidence_hit", "Confidence Hit");
        dimensionLabels.put("caregiving_load", "Caregiving Load");
        dimensionLabels.put("uncertainty_load", "Uncertainty Load");

        dimensionStrengthHints.put("joy_loss", "Your sense of joy is still reachable, which helps recovery stick.");
        dimensionStrengthHints.put("social_battery", "Supportive connection is still available to you.");
        dimensionStrengthHints.put("focus_capacity", "Your focus can still respond to structure and small wins.");
        dimensionStrengthHints.put("recovery_habits", "You still have recovery routines we can strengthen.");
    }

    private void initCategories() {
        challengeCategories.put("personal", new ChallengeCategory("personal", "Personal", "Rebuild self-trust in small ways."));
        challengeCategories.put("inner_peace", new ChallengeCategory("inner_peace", "Inner Peace", "Create moments of calm inside the day."));
        challengeCategories.put("health", new ChallengeCategory("health", "Health", "Help the body stop carrying all the pressure."));
        challengeCategories.put("family_social",
                new ChallengeCategory("family_social", "Family / Social", "Use safe human connection as recovery fuel."));
        challengeCategories.put("career_study",
                new ChallengeCategory("career_study", "Career / Study", "Make progress without feeding overwhelm."));
        challengeCategories.put("fun", new ChallengeCategory("fun", "Joy / Fun", "Bring back lightness, not just productivity."));
    }

    private void initQuestions() {
        coreQuestions.add(question("q_overload", "I feel mentally overloaded by my responsibilities.", "mental_load",
                "Think about the past 7 days."));
        coreQuestions.add(question("q_worry", "Worry keeps running in my mind even when the day is quiet.", "emotional_strain",
                "Notice both day and night."));
        coreQuestions.add(question("q_sleep", "My sleep is not helping me feel restored.", "sleep_recovery",
                "Include trouble falling asleep or waking tired."));
        coreQuestions.add(question("q_focus", "It is hard for me to stay present with one task.", "focus_capacity",
                "Focus on your usual routine."));
        coreQuestions.add(question("q_joy", "Things that normally feel enjoyable are feeling flat.", "joy_loss",
                "Small joys count here too."));
        coreQuestions.add(question("q_body", "Stress is showing up in my body through fatigue, headaches, or tightness.",
                "body_stress", "Listen to physical signs as well."));
        coreQuestions.add(question("q_support", "I feel emotionally alone even when people are around.", "social_battery",
                "This is about felt support, not crowd size."));
        coreQuestions.add(question("q_recovery", "I keep postponing breaks, rest, or self-care until it is too late.",
                "recovery_habits", "Think about recovery that actually happens."));

        profiles.put("student", new ProfileBlueprint(
                "student",
                "Student",
                "Built for exam stress, deadlines, peer comparison, and future uncertainty.",
                "Supportive and motivating",
                List.of(
                        question("q_study_deadlines", "Academic deadlines keep following me even when I try to relax.",
                                "study_pressure", "Assignments, exams, and backlog all count."),
                        question("q_study_compare", "Comparing myself with classmates affects my confidence.",
                                "confidence_hit", "Think about marks, internships, or pace."),
                        question("q_study_future", "Thinking about my future makes me feel tense or stuck.",
                                "uncertainty_load", "Career fear and family expectations count."),
                        question("q_study_focus", "Once I lose momentum, it is hard to restart my study flow.",
                                "focus_capacity", "Notice how often the day slips away."))));

        profiles.put("professional", new ProfileBlueprint(
                "professional",
                "Working Professional",
                "Built for deadline pressure, burnout, low recovery, and work-life spillover.",
                "Clear and grounding",
                List.of(
                        question("q_work_overflow", "Work keeps leaking into my personal time.", "burnout_risk",
                                "Think after-hours messages, pending tasks, and mental carryover."),
                        question("q_work_drain", "By the end of the workday I feel emotionally drained.", "burnout_risk",
                                "Even if the work gets done, notice the recovery cost."),
                        question("q_work_pressure", "I feel pressure to always stay productive or available.", "career_pressure",
                                "Meetings, pings, and performance pressure count."),
                        question("q_work_disconnect", "It is hard to mentally switch off after work.", "sleep_recovery",
                                "Notice evenings and bedtime too."))));

        profiles.put("job_seeker", new ProfileBlueprint(
                "job_seeker",
                "Job Seeker",
                "Built for rejection fatigue, uncertainty, confidence drops, and comparison stress.",
                "Gentle but forward-moving",
                List.of(
                        question("q_job_rejection", "Rejections or silence from applications hit my self-worth.",
                                "confidence_hit", "Include ghosting and delayed replies."),
                        question("q_job_future", "Uncertainty about my next step feels heavy on most days.",
                                "uncertainty_load", "Financial and identity pressure both count."),
                        question("q_job_compare", "Seeing others move ahead makes my search feel harder.",
                                "emotional_strain", "Comparison can quietly drain motivation."),
                        question("q_job_routine", "When the search feels bad, my routine quickly falls apart.",
                                "recovery_habits", "Think about sleep, meals, movement, and focus."))));

        profiles.put("parent", new ProfileBlueprint(
                "parent",
                "Parent / Caregiver",
                "Built for caregiving overload, guilt, low rest, and invisible planning fatigue.",
                "Warm and reassuring",
                List.of(
                        question("q_parent_rest", "I struggle to take rest without feeling guilty.", "caregiving_load",
                                "Even short pauses count."),
                        question("q_parent_load", "The invisible planning for home or family stays in my head all day.",
                                "mental_load", "Scheduling, remembering, and anticipating count."),
                        question("q_parent_time", "My needs get pushed aside until I am already exhausted.",
                                "caregiving_load", "Think about food, sleep, breaks, or joy."),
                        question("q_parent_support", "I feel like I carry too much on my own.", "social_battery",
                                "This can happen even with loving people around."))));

        profiles.put("entrepreneur", new ProfileBlueprint(
                "entrepreneur",
                "Founder / Entrepreneur",
                "Built for decision fatigue, uncertainty, long hours, and lonely responsibility.",
                "Strategic and calming",
                List.of(
                        question("q_founder_pressure", "Business uncertainty keeps my mind in constant alert mode.",
                                "uncertainty_load", "Money, growth, and responsibility all count."),
                        question("q_founder_decisions", "Too many decisions are leaving me mentally tired.", "mental_load",
                                "Both small and big decisions matter."),
                        question("q_founder_lonely", "Carrying leadership pressure often feels lonely.", "social_battery",
                                "This is about emotional load, not networking."),
                        question("q_founder_work", "My recovery usually loses to the next problem I need to solve.",
                                "burnout_risk", "Notice how often rest gets postponed."))));
    }

    private void initTasks() {
        taskLibrary.add(task("personal_strengths", "personal", "Write 3 strengths you still have",
                "Keep it short and honest. We are rebuilding self-trust, not perfection.", 6,
                profiles("all"), dims("confidence_hit", "emotional_strain"), true, true));
        taskLibrary.add(task("personal_journal", "personal", "Do a 5-line pressure journal",
                "Write what is heavy, what is real, and what can wait.", 8,
                profiles("all"), dims("mental_load", "uncertainty_load"), true, true));
        taskLibrary.add(task("personal_reset", "personal", "Clear one tiny corner of your space",
                "A visible reset helps the brain feel less crowded.", 10,
                profiles("all"), dims("mental_load", "focus_capacity"), true, false));
        taskLibrary.add(task("personal_compassion", "personal", "Replace one self-critical thought",
                "Catch it, soften it, and choose a fairer sentence.", 5,
                profiles("all"), dims("confidence_hit", "emotional_strain"), true, true));

        taskLibrary.add(task("peace_breathing", "inner_peace", "Do a 4-minute breathing reset",
                "Inhale for 4, exhale for 6, and let your shoulders drop.", 4,
                profiles("all"), dims("emotional_strain", "body_stress"), true, true));
        taskLibrary.add(task("peace_grounding", "inner_peace", "Try a 5-4-3-2-1 grounding round",
                "Name five things you see and keep returning to the room.", 6,
                profiles("all"), dims("emotional_strain", "mental_load"), true, true));
        taskLibrary.add(task("peace_music", "inner_peace", "Listen to one calming track without multitasking",
                "Let the music be the only task for a few minutes.", 8,
                profiles("all"), dims("body_stress", "joy_loss"), true, true));
        taskLibrary.add(task("peace_nature", "inner_peace", "Spend 5 quiet minutes near fresh air or a window",
                "Give your nervous system a change of scene.", 5,
                profiles("all"), dims("emotional_strain", "sleep_recovery"), true, true));

        taskLibrary.add(task("health_hydrate", "health", "Finish one full bottle of water before noon",
                "Keep it simple and measurable.", 5,
                profiles("all"), dims("body_stress", "recovery_habits"), true, false));
        taskLibrary.add(task("health_walk", "health", "Take a 10-minute walk with no pressure to perform",
                "This is a reset, not a workout.", 10,
                profiles("all"), dims("body_stress", "joy_loss"), false, false));
        taskLibrary.add(task("health_sleep", "health", "Create a 20-minute screen-light wind-down",
                "Dim the room, lower the noise, and stop chasing more output.", 20,
                profiles("all"), dims("sleep_recovery", "burnout_risk"), true, true));
        taskLibrary.add(task("health_stretch", "health", "Do a gentle stretch for your neck, shoulders, and back",
                "Release where stress hides in the body.", 8,
                profiles("all"), dims("body_stress", "mental_load"), true, true));

        taskLibrary.add(task("social_text", "family_social", "Send one honest check-in message",
                "A simple 'rough day, just saying hi' is enough.", 5,
                profiles("all"), dims("social_battery", "emotional_strain"), true, true));
        taskLibrary.add(task("social_walk", "family_social", "Invite one safe person for a short walk or tea",
                "Connection works better when it stays light and real.", 20,
                profiles("all"), dims("social_battery", "joy_loss"), false, false));
        taskLibrary.add(task("social_help", "family_social", "Ask for help with one small thing",
                "Recovery gets stronger when the load is shared.", 5,
                profiles("parent", "professional", "entrepreneur"), dims("caregiving_load", "mental_load"), true, true));
        taskLibrary.add(task("social_gratitude", "family_social", "Share one appreciation with family or a friend",
                "A small sincere message can reopen connection.", 4,
                profiles("all"), dims("social_battery", "joy_loss"), true, true));

        taskLibrary.add(task("career_focus", "career_study", "Work in one protected 25-minute focus block",
                "Choose one meaningful task and ignore the rest until the timer ends.", 25,
                profiles("student", "professional", "entrepreneur"), dims("focus_capacity", "study_pressure", "career_pressure"), false, false));
        taskLibrary.add(task("career_top3", "career_study", "Write your top 3 priorities for tomorrow",
                "Reduce mental clutter before it multiplies.", 7,
                profiles("all"), dims("mental_load", "focus_capacity"), true, true));
        taskLibrary.add(task("career_shutdown", "career_study", "Do a real shutdown ritual after work or study",
                "List what is done, what is next, and what can wait.", 8,
                profiles("professional", "student", "entrepreneur"), dims("burnout_risk", "sleep_recovery"), true, true));
        taskLibrary.add(task("career_apply", "career_study", "Do one high-quality application or outreach only",
                "One thoughtful move is better than ten panic clicks.", 20,
                profiles("job_seeker"), dims("career_pressure", "confidence_hit", "uncertainty_load"), false, false));

        taskLibrary.add(task("fun_comedy", "fun", "Watch one light comedy clip or scene",
                "Give your brain a clean break from seriousness.", 8,
                profiles("all"), dims("joy_loss", "emotional_strain"), true, true));
        taskLibrary.add(task("fun_music", "fun", "Play one favorite song and move with it",
                "A little motion can break emotional freezing.", 5,
                profiles("all"), dims("joy_loss", "body_stress"), true, false));
        taskLibrary.add(task("fun_hobby", "fun", "Spend 15 minutes on a hobby with zero performance pressure",
                "This is about pleasure, not achievement.", 15,
                profiles("all"), dims("joy_loss", "confidence_hit"), false, false));
        taskLibrary.add(task("fun_sunlight", "fun", "Step outside for sunlight and a different view",
                "Even a short reset can make the day feel less trapped.", 10,
                profiles("all"), dims("joy_loss", "sleep_recovery"), false, false));
    }

    private void initArticles() {
        articleLibrary.add(article(
                "Understanding stress management",
                "A strong starting point for understanding stress signals and practical coping.",
                "https://www.apa.org/topics/stress/tips",
                "https://images.unsplash.com/photo-1517021897933-0e0319cfbc28?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
                "APA",
                profiles("all"),
                dims("mental_load", "emotional_strain")));
        articleLibrary.add(article(
                "The benefits of mindfulness",
                "Mindfulness can help settle racing thoughts and reduce emotional overflow.",
                "https://www.mayoclinic.org/healthy-lifestyle/consumer-health/in-depth/mindfulness-exercises/art-20046356",
                "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
                "Mayo Clinic",
                profiles("all"),
                dims("emotional_strain", "body_stress")));
        articleLibrary.add(article(
                "Relaxation techniques: breath control helps quell errant stress response",
                "A practical breathing resource for quick nervous-system downshifts.",
                "https://www.health.harvard.edu/mind-and-mood/relaxation-techniques-breath-control-helps-quell-errant-stress-response",
                "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
                "Harvard Health",
                profiles("all"),
                dims("body_stress", "emotional_strain")));
        articleLibrary.add(article(
                "Sleep and mental health",
                "A useful read when sleep quality is making everything else harder.",
                "https://www.sleepfoundation.org/mental-health",
                "https://images.unsplash.com/photo-1541781777621-3914296d36e7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
                "Sleep Foundation",
                profiles("all"),
                dims("sleep_recovery", "burnout_risk")));
        articleLibrary.add(article(
                "How to cope with burnout",
                "Helpful for people carrying work pressure or nonstop output expectations.",
                "https://www.mayoclinichealthsystem.org/hometown-health/speaking-of-health/burnout-is-more-than-just-exhaustion",
                "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
                "Mayo Clinic Health System",
                profiles("professional", "entrepreneur"),
                dims("burnout_risk", "career_pressure")));
        articleLibrary.add(article(
                "Self-esteem: take steps to feel better about yourself",
                "A good fit when comparison, rejection, or self-doubt are hitting confidence.",
                "https://www.mayoclinic.org/healthy-lifestyle/adult-health/in-depth/self-esteem/art-20045374",
                "https://images.unsplash.com/photo-1516302752625-fcc3c50ae61f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
                "Mayo Clinic",
                profiles("student", "job_seeker"),
                dims("confidence_hit", "uncertainty_load")));
    }

    private QuestionDef question(String id, String prompt, String dimension, String helperText) {
        return new QuestionDef(id, prompt, dimension, helperText);
    }

    private TaskTemplate task(String id, String categoryKey, String title, String description, int minutes,
            Set<String> profiles, Set<String> focusDimensions, boolean lowEnergyFriendly, boolean sleepFriendly) {
        return new TaskTemplate(id, categoryKey, title, description, minutes, profiles, focusDimensions,
                lowEnergyFriendly, sleepFriendly);
    }

    private ArticleTemplate article(String title, String summary, String url, String image, String source,
            Set<String> profiles, Set<String> dimensions) {
        return new ArticleTemplate(title, summary, url, image, source, profiles, dimensions);
    }

    private Set<String> profiles(String... values) {
        return Set.of(values);
    }

    private Set<String> dims(String... values) {
        return Set.of(values);
    }

    private record ProfileBlueprint(String key, String label, String description, String tone,
            List<QuestionDef> questions) {
    }

    private record QuestionDef(String id, String prompt, String dimension, String helperText) {
    }

    private record ChallengeCategory(String key, String label, String objective) {
    }

    private record TaskTemplate(String id, String categoryKey, String title, String description, int minutes,
            Set<String> profiles, Set<String> focusDimensions, boolean lowEnergyFriendly, boolean sleepFriendly) {
    }

    private record ArticleTemplate(String title, String summary, String url, String image, String source,
            Set<String> profiles, Set<String> dimensions) {
    }
}
