package com.aicodebase.architect.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record ChatRequestDto(
    @NotNull(message = "Repository ID is required")
    @JsonProperty("repository_id")
    @JsonAlias({"repositoryId", "repository_id"})
    UUID repositoryId,

    @NotBlank(message = "Message cannot be empty")
    @JsonProperty("message")
    String message,

    @JsonProperty("conversation_id")
    @JsonAlias({"conversationId", "conversation_id"})
    UUID conversationId,

    @JsonProperty("provider")
    String provider,

    @JsonProperty("custom_api_key")
    @JsonAlias({"customApiKey", "custom_api_key"})
    String customApiKey,

    @JsonProperty("custom_model")
    @JsonAlias({"customModel", "custom_model"})
    String customModel,

    @JsonProperty("custom_base_url")
    @JsonAlias({"customBaseUrl", "custom_base_url"})
    String customBaseUrl
) {
    public ChatRequestDto(UUID repositoryId, String message, UUID conversationId, String provider) {
        this(repositoryId, message, conversationId, provider, null, null, null);
    }
}
