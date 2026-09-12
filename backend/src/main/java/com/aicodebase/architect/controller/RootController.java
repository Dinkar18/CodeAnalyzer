package com.aicodebase.architect.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class RootController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> root() {
        return ResponseEntity.ok(Map.of(
            "service", "AI Codebase Architect - Backend API",
            "status", "UP",
            "version", "2.0.0",
            "health", "/actuator/health",
            "authEndpoints", "/api/auth"
        ));
    }
}
