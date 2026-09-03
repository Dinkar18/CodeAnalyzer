package com.aicodebase.architect.dto;

import com.aicodebase.architect.model.enums.FindingCategory;
import com.aicodebase.architect.model.enums.FindingSeverity;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.UUID;

public record FindingDto(
    UUID id,
    FindingCategory category,
    FindingSeverity severity,
    String title,
    @JsonProperty("file_path")
    @JsonAlias({"filePath", "file_path"})
    String filePath,
    @JsonProperty("line_number")
    @JsonAlias({"lineNumber", "line_number"})
    Integer lineNumber,
    String finding,
    String evidence,
    String recommendation
) {}
