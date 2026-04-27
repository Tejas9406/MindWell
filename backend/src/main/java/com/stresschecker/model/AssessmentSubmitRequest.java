package com.stresschecker.model;

import java.util.List;

public class AssessmentSubmitRequest {
    private String email;
    private String profileType;
    private String supportStyle;
    private String sleepQuality;
    private String energyLevel;
    private Integer availableMinutes;
    private List<AssessmentAnswerRequest> answers;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
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

    public Integer getAvailableMinutes() {
        return availableMinutes;
    }

    public void setAvailableMinutes(Integer availableMinutes) {
        this.availableMinutes = availableMinutes;
    }

    public List<AssessmentAnswerRequest> getAnswers() {
        return answers;
    }

    public void setAnswers(List<AssessmentAnswerRequest> answers) {
        this.answers = answers;
    }
}
