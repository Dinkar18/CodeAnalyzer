package com.aicodebase.architect.dto;

import java.time.Instant;
import java.util.UUID;

public record ConversationDto(
    UUID id,
    UUID repositoryId,
    String title,
    Instant createdAt
) {}
