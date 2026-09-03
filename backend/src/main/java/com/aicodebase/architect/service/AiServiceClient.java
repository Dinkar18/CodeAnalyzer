package com.aicodebase.architect.service;

import com.aicodebase.architect.constant.ApiEndpoints;
import com.aicodebase.architect.constant.AppConstants;
import com.aicodebase.architect.dto.*;
import com.aicodebase.architect.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiServiceClient {

    private final WebClient aiServiceWebClient;

    public IndexStatusDto triggerIndexing(UUID repositoryId, String url, String branch, boolean forceReindex) {
        log.info("Triggering indexing on AI Service for repo {} (url: {})", repositoryId, url);
        try {
            return aiServiceWebClient.post()
                .uri(ApiEndpoints.AiService.INDEX)
                .bodyValue(Map.of(
                    "repository_id", repositoryId.toString(),
                    "url", url,
                    "branch", branch != null ? branch : AppConstants.DEFAULT_BRANCH,
                    "force_reindex", forceReindex
                ))
                .retrieve()
                .bodyToMono(IndexStatusDto.class)
                .block();
        } catch (Exception e) {
            log.error("Failed to trigger indexing via AI Service: {}", e.getMessage());
            throw new BusinessException("AI Service indexing invocation failed: " + e.getMessage(), e);
        }
    }

    public IndexStatusDto getIndexStatus(UUID repositoryId) {
        try {
            return aiServiceWebClient.get()
                .uri(ApiEndpoints.AiService.INDEX_STATUS, repositoryId)
                .retrieve()
                .bodyToMono(IndexStatusDto.class)
                .block();
        } catch (Exception e) {
            log.warn("Failed to get index status from AI Service: {}", e.getMessage());
            return null;
        }
    }

    public List<String> getBranches(UUID repositoryId) {
        try {
            return aiServiceWebClient.get()
                .uri(ApiEndpoints.AiService.BRANCHES, repositoryId)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<String>>() {})
                .block();
        } catch (Exception e) {
            log.warn("Failed to get branches for repo {}: {}", repositoryId, e.getMessage());
            return List.of("main");
        }
    }

    public Map<String, Object> getDiff(UUID repositoryId, String base, String target) {
        try {
            return aiServiceWebClient.get()
                .uri(uriBuilder -> uriBuilder
                    .path(ApiEndpoints.AiService.DIFF)
                    .queryParam("base", base != null ? base : "main")
                    .queryParam("target", target != null ? target : "HEAD")
                    .build(repositoryId))
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();
        } catch (Exception e) {
            log.warn("Failed to get diff for repo {}: {}", repositoryId, e.getMessage());
            return Map.of("error", e.getMessage(), "diff", "");
        }
    }

    public Map<String, Object> getGraph(UUID repositoryId) {
        try {
            return aiServiceWebClient.get()
                .uri(ApiEndpoints.AiService.GRAPH, repositoryId)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();
        } catch (Exception e) {
            log.warn("Failed to get graph from AI Service for repo {}: {}", repositoryId, e.getMessage());
            return Map.of("nodes", List.of(), "edges", List.of());
        }
    }

    public ChatResponseDto chat(ChatRequestDto request) {
        log.info("Sending chat query for repository {}", request.repositoryId());
        try {
            Map<String, Object> payload = buildChatPayload(request);
            return aiServiceWebClient.post()
                .uri(ApiEndpoints.AiService.CHAT)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(ChatResponseDto.class)
                .block();
        } catch (Exception e) {
            log.error("AI Service chat invocation failed: {}", e.getMessage());
            throw new BusinessException("AI Service chat invocation failed: " + e.getMessage(), e);
        }
    }

    public Flux<String> streamChat(ChatRequestDto request) {
        log.info("Opening chat SSE stream for repository {}", request.repositoryId());
        Map<String, Object> payload = buildChatPayload(request);
        return aiServiceWebClient.post()
            .uri(ApiEndpoints.AiService.CHAT_STREAM)
            .accept(MediaType.TEXT_EVENT_STREAM)
            .bodyValue(payload)
            .retrieve()
            .bodyToFlux(String.class);
    }

    private Map<String, Object> buildChatPayload(ChatRequestDto request) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("repository_id", request.repositoryId().toString());
        payload.put("message", request.message());
        if (request.conversationId() != null) {
            payload.put("conversation_id", request.conversationId().toString());
        }
        if (request.provider() != null && !request.provider().isBlank()) {
            payload.put("provider", request.provider());
        }
        if (request.customApiKey() != null && !request.customApiKey().isBlank()) {
            payload.put("custom_api_key", request.customApiKey());
        }
        if (request.customModel() != null && !request.customModel().isBlank()) {
            payload.put("custom_model", request.customModel());
        }
        if (request.customBaseUrl() != null && !request.customBaseUrl().isBlank()) {
            payload.put("custom_base_url", request.customBaseUrl());
        }
        return payload;
    }

    public List<FindingDto> analyze(AnalyzeRequestDto request) {
        log.info("Triggering specialist analysis on AI Service for repo {}", request.repositoryId());
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("repository_id", request.repositoryId().toString());
            if (request.categories() != null) {
                payload.put("categories", request.categories());
            }

            return aiServiceWebClient.post()
                .uri(ApiEndpoints.AiService.ANALYZE)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<FindingDto>>() {})
                .block();
        } catch (Exception e) {
            log.error("AI Service analysis failed: {}", e.getMessage());
            throw new BusinessException("AI Service analysis failed: " + e.getMessage(), e);
        }
    }
}
