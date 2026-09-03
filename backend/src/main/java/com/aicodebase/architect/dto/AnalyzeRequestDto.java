package com.aicodebase.architect.dto;

import com.aicodebase.architect.model.enums.FindingCategory;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public record AnalyzeRequestDto(
    @NotNull(message = "Repository ID is required")
    UUID repositoryId,

    List<FindingCategory> categories
) {}
