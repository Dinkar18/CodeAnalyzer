package com.aicodebase.architect.dto;

import java.time.Instant;
import java.util.List;

public record ErrorResponse(
    int status,
    String error,
    String message,
    String path,
    Instant timestamp,
    List<String> validationErrors
) {
    public ErrorResponse(int status, String error, String message, String path) {
        this(status, error, message, path, Instant.now(), List.of());
    }

    public ErrorResponse(int status, String error, String message, String path, List<String> validationErrors) {
        this(status, error, message, path, Instant.now(), validationErrors);
    }
}
