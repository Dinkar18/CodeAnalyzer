package com.aicodebase.architect.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.UUID;

public record ChatResponseDto(
    @JsonProperty("conversation_id")
    @JsonAlias({"conversationId", "conversation_id"})
    UUID conversationId,

    String response,

    List<CodeEvidenceDto> evidence,

    @JsonProperty("provider_used")
    @JsonAlias({"providerUsed", "provider_used"})
    String providerUsed
) {}
