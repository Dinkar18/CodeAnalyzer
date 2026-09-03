package com.aicodebase.architect.dto;

import com.aicodebase.architect.model.enums.RepositoryStatus;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record RepositoryResponse(
    UUID id,
    String name,
    String url,
    String defaultBranch,
    RepositoryStatus status,
    List<String> technologyStack,
    String applicationType,
    String description,
    Instant createdAt,
    Instant updatedAt
) {}
