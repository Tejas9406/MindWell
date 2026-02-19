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

    public Date getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(Date lastUpdated) {
        this.lastUpdated = lastUpdated;
    }
}
