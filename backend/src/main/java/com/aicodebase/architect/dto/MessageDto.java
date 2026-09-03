package com.aicodebase.architect.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record MessageDto(
    UUID id,
    UUID conversationId,
    String role,
    String content,
    List<CodeEvidenceDto> evidence,
    Instant createdAt
) {}
