package com.aicodebase.architect.controller;

import com.aicodebase.architect.config.SecurityConfig;
import com.aicodebase.architect.dto.RepositoryCreateRequest;
import com.aicodebase.architect.dto.RepositoryResponse;
import com.aicodebase.architect.model.enums.RepositoryStatus;
import com.aicodebase.architect.service.IndexingJobService;
import com.aicodebase.architect.service.RepositoryService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(RepositoryController.class)
@Import(SecurityConfig.class)
class RepositoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RepositoryService repositoryService;

    @MockBean
    private IndexingJobService indexingJobService;

    @Test
    @DisplayName("POST /api/repositories with valid body should return 201 CREATED")
    void createRepository_Valid_Returns201() throws Exception {
        UUID id = UUID.randomUUID();
        RepositoryCreateRequest request = new RepositoryCreateRequest(
            "test-repo",
            "https://github.com/example/test-repo.git",
            "main",
            "Test description"
        );

        RepositoryResponse response = new RepositoryResponse(
            id,
            "test-repo",
            "https://github.com/example/test-repo.git",
            "main",
            RepositoryStatus.PENDING,
            List.of("Java"),
            "BACKEND_API",
            "Test description",
            Instant.now(),
            Instant.now()
        );

        when(repositoryService.createRepository(any(RepositoryCreateRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/repositories")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(id.toString()))
            .andExpect(jsonPath("$.name").value("test-repo"))
            .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    @DisplayName("POST /api/repositories with invalid URL should return 400 BAD REQUEST")
    void createRepository_InvalidUrl_Returns400() throws Exception {
        RepositoryCreateRequest request = new RepositoryCreateRequest(
            "test-repo",
            "not-a-valid-url",
            "main",
            "Test"
        );

        mockMvc.perform(post("/api/repositories")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400));
    }
}
