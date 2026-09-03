package com.aicodebase.architect.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

public record CodeEvidenceDto(
    @JsonProperty("file_path")
    @JsonAlias({"filePath", "file_path"})
    String filePath,

    @JsonProperty("start_line")
    @JsonAlias({"startLine", "start_line"})
    int startLine,

    @JsonProperty("end_line")
    @JsonAlias({"endLine", "end_line"})
    int endLine,

    String snippet,

    @JsonProperty("relevance_score")
    @JsonAlias({"relevanceScore", "relevance_score"})
    Double relevanceScore
) {}
