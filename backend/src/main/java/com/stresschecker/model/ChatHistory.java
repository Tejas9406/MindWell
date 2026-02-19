package com.stresschecker.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Document(collection = "chat_histories")
public class ChatHistory {

    @Id
    private String email;

    private List<Map<String, String>> messages;

    private Date lastUpdated;

    public ChatHistory() {
        this.messages = new ArrayList<>();
    }

    public ChatHistory(String email) {
        this.email = email;
        this.messages = new ArrayList<>();
        this.lastUpdated = new Date();
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public List<Map<String, String>> getMessages() {
        return messages;
    }

    public void setMessages(List<Map<String, String>> messages) {
        this.messages = messages;
    }

    public Date getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(Date lastUpdated) {
        this.lastUpdated = lastUpdated;
    }
}
