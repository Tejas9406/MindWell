package com.stresschecker.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.Date;
import java.util.List;
import java.util.Map;

@Document(collection = "users")
public class UserData {

    @Id
    private String email;

    private List<Long> answers;

    @Field("total_score")
    private int totalScore;

    @Field("stress_level")
    private String stressLevel;

    @Field("color_code")
    private String colorCode;

    @Field("detailed_responses")
    private List<Map<String, Object>> detailedResponses;

    @Field("profile_type")
    private String profileType;

    @Field("support_style")
    private String supportStyle;

    @Field("sleep_quality")
    private String sleepQuality;

    @Field("energy_level")
    private String energyLevel;

    @Field("available_minutes")
    private int availableMinutes;

    @Field("dimension_scores")
    private Map<String, Integer> dimensionScores;

    @Field("dimension_breakdown")
    private List<Map<String, Object>> dimensionBreakdown;

    @Field("top_triggers")
    private List<String> topTriggers;

    @Field("strengths")
    private List<String> strengths;

    private String summary;

    @Field("weekly_focus")
    private String weeklyFocus;

    @Field("wellness_signals")
    private Map<String, Object> wellnessSignals;

    @Field("weekly_challenges")
    private List<Map<String, Object>> weeklyChallenges;

    @Field("challenge_milestones")
    private List<Map<String, Object>> challengeMilestones;

    @Field("rescue_plan")
    private List<Map<String, Object>> rescuePlan;

    @Field("weekly_plan_progress")
    private Map<String, Map<String, Object>> weeklyPlanProgress;

    @Field("weekly_plan_meta")
    private Map<String, Object> weeklyPlanMeta;

    @Field("weekly_check_ins")
    private List<Map<String, Object>> weeklyCheckIns;

    @Field("last_updated")
    private Date lastUpdated;

    public UserData() {
    }

    public UserData(String email, List<Long> answers, int totalScore,
            String stressLevel, String colorCode,
            List<Map<String, Object>> detailedResponses) {
        this.email = email;
        this.answers = answers;
        this.totalScore = totalScore;
        this.stressLevel = stressLevel;
        this.colorCode = colorCode;
        this.detailedResponses = detailedResponses;
        this.lastUpdated = new Date();
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public List<Long> getAnswers() {
        return answers;
    }

    public void setAnswers(List<Long> answers) {
        this.answers = answers;
    }

    public int getTotalScore() {
        return totalScore;
    }

    public void setTotalScore(int totalScore) {
        this.totalScore = totalScore;
    }

    public String getStressLevel() {
        return stressLevel;
    }

    public void setStressLevel(String stressLevel) {
        this.stressLevel = stressLevel;
    }

    public String getColorCode() {
        return colorCode;
    }

    public void setColorCode(String colorCode) {
        this.colorCode = colorCode;
    }

    public List<Map<String, Object>> getDetailedResponses() {
        return detailedResponses;
    }

    public void setDetailedResponses(List<Map<String, Object>> detailedResponses) {
        this.detailedResponses = detailedResponses;
    }

    public String getProfileType() {
        return profileType;
    }

    public void setProfileType(String profileType) {
        this.profileType = profileType;
    }

    public String getSupportStyle() {
        return supportStyle;
    }

    public void setSupportStyle(String supportStyle) {
        this.supportStyle = supportStyle;
    }

    public String getSleepQuality() {
        return sleepQuality;
    }

    public void setSleepQuality(String sleepQuality) {
        this.sleepQuality = sleepQuality;
    }

    public String getEnergyLevel() {
        return energyLevel;
    }

    public void setEnergyLevel(String energyLevel) {
        this.energyLevel = energyLevel;
    }

    public int getAvailableMinutes() {
        return availableMinutes;
    }

    public void setAvailableMinutes(int availableMinutes) {
        this.availableMinutes = availableMinutes;
    }

    public Map<String, Integer> getDimensionScores() {
        return dimensionScores;
    }

    public void setDimensionScores(Map<String, Integer> dimensionScores) {
        this.dimensionScores = dimensionScores;
    }

    public List<Map<String, Object>> getDimensionBreakdown() {
        return dimensionBreakdown;
    }

    public void setDimensionBreakdown(List<Map<String, Object>> dimensionBreakdown) {
        this.dimensionBreakdown = dimensionBreakdown;
    }

    public List<String> getTopTriggers() {
        return topTriggers;
    }

    public void setTopTriggers(List<String> topTriggers) {
        this.topTriggers = topTriggers;
    }

    public List<String> getStrengths() {
        return strengths;
    }

    public void setStrengths(List<String> strengths) {
        this.strengths = strengths;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getWeeklyFocus() {
        return weeklyFocus;
    }

    public void setWeeklyFocus(String weeklyFocus) {
        this.weeklyFocus = weeklyFocus;
    }

    public Map<String, Object> getWellnessSignals() {
        return wellnessSignals;
    }

    public void setWellnessSignals(Map<String, Object> wellnessSignals) {
        this.wellnessSignals = wellnessSignals;
    }

    public List<Map<String, Object>> getWeeklyChallenges() {
        return weeklyChallenges;
    }

    public void setWeeklyChallenges(List<Map<String, Object>> weeklyChallenges) {
        this.weeklyChallenges = weeklyChallenges;
    }

    public List<Map<String, Object>> getChallengeMilestones() {
        return challengeMilestones;
    }

    public void setChallengeMilestones(List<Map<String, Object>> challengeMilestones) {
        this.challengeMilestones = challengeMilestones;
    }

    public List<Map<String, Object>> getRescuePlan() {
        return rescuePlan;
    }

    public void setRescuePlan(List<Map<String, Object>> rescuePlan) {
        this.rescuePlan = rescuePlan;
    }

    public Map<String, Map<String, Object>> getWeeklyPlanProgress() {
        return weeklyPlanProgress;
    }

    public void setWeeklyPlanProgress(Map<String, Map<String, Object>> weeklyPlanProgress) {
        this.weeklyPlanProgress = weeklyPlanProgress;
    }

    public Map<String, Object> getWeeklyPlanMeta() {
        return weeklyPlanMeta;
    }

    public void setWeeklyPlanMeta(Map<String, Object> weeklyPlanMeta) {
        this.weeklyPlanMeta = weeklyPlanMeta;
    }

    public List<Map<String, Object>> getWeeklyCheckIns() {
        return weeklyCheckIns;
    }

    public void setWeeklyCheckIns(List<Map<String, Object>> weeklyCheckIns) {
        this.weeklyCheckIns = weeklyCheckIns;
    }

    public Date getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(Date lastUpdated) {
        this.lastUpdated = lastUpdated;
    }
}
