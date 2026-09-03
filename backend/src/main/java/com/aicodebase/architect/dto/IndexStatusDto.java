package com.aicodebase.architect.dto;

import com.aicodebase.architect.model.enums.RepositoryStatus;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.UUID;

public record IndexStatusDto(
    @JsonProperty("repository_id")
    @JsonAlias({"repositoryId", "repository_id"})
    UUID repositoryId,

    RepositoryStatus status,

    @JsonProperty("progress_percentage")
    @JsonAlias({"progressPercentage", "progress_percentage"})
    int progressPercentage,

    @JsonProperty("current_step")
    @JsonAlias({"currentStep", "current_step"})
    String currentStep,

    @JsonProperty("error_message")
    @JsonAlias({"errorMessage", "error_message"})
    String errorMessage,

    @JsonProperty("file_count")
    @JsonAlias({"fileCount", "file_count"})
    int fileCount,

    @JsonProperty("symbol_count")
    @JsonAlias({"symbolCount", "symbol_count"})
    int symbolCount,

    @JsonProperty("chunk_count")
    @JsonAlias({"chunkCount", "chunk_count"})
    int chunkCount
) {}
