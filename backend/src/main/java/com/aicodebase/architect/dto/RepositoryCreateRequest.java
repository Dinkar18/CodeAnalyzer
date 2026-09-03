package com.aicodebase.architect.dto;

import jakarta.validation.constraints.NotBlank;
import org.hibernate.validator.constraints.URL;

public record RepositoryCreateRequest(
    @NotBlank(message = "Repository name is required")
    String name,

    @NotBlank(message = "Repository URL is required")
    @URL(message = "Repository URL must be a valid URL")
    String url,

    String defaultBranch,
    String description
) {}
