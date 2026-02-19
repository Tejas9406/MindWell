package com.stresschecker.config;

import org.springframework.context.annotation.Configuration;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;

@Configuration
public class MongoConfig {

    @Value("${spring.data.mongodb.database:stress_checker_db}")
    private String databaseName;

    @PostConstruct
    public void init() {
        System.out.println("✅ MongoDB Atlas Config Loaded — database: " + databaseName);
    }
}
