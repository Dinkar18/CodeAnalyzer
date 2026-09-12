package com.aicodebase.architect;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableJpaRepositories(basePackages = "com.aicodebase.architect.repository")
@EnableAsync
public class AiCodebaseArchitectApplication {

    public static void main(String[] args) {
        SpringApplication.run(AiCodebaseArchitectApplication.class, args);
    }
}

