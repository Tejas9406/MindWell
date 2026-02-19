package com.stresschecker.repository;

import com.stresschecker.model.ChatHistory;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatHistoryRepository extends MongoRepository<ChatHistory, String> {
    // findById(email), save(chatHistory) are auto-generated
}
