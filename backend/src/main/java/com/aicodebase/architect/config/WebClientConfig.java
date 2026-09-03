package com.aicodebase.architect.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;

@Configuration
public class WebClientConfig {

    @Value("${ai-service.url:${ai-service.base-url:${AI_SERVICE_URL:http://localhost:8001}}}")
    private String aiServiceBaseUrl;

    @Value("${ai-service.timeout-seconds:120}")
    private int timeoutSeconds;

    @Bean
    public WebClient aiServiceWebClient() {
        HttpClient httpClient = HttpClient.create()
            .responseTimeout(Duration.ofSeconds(timeoutSeconds));

        return WebClient.builder()
            .baseUrl(aiServiceBaseUrl)
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .build();
    }
}
