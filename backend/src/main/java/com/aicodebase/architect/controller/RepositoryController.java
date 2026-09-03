package com.aicodebase.architect.controller;

import com.aicodebase.architect.constant.ApiEndpoints;
import com.aicodebase.architect.dto.IndexStatusDto;
import com.aicodebase.architect.dto.RepositoryCreateRequest;
import com.aicodebase.architect.dto.RepositoryResponse;
import com.aicodebase.architect.service.IndexingJobService;
import com.aicodebase.architect.service.RepositoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping(ApiEndpoints.REPOSITORIES)
@RequiredArgsConstructor
public class RepositoryController {

    private final RepositoryService repositoryService;
    private final IndexingJobService indexingJobService;

    @PostMapping
    public ResponseEntity<RepositoryResponse> createRepository(@Valid @RequestBody RepositoryCreateRequest request) {
        RepositoryResponse response = repositoryService.createRepository(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<RepositoryResponse>> getAllRepositories() {
        return ResponseEntity.ok(repositoryService.getAllRepositories());
    }

    @GetMapping(ApiEndpoints.REPOSITORY_BY_ID)
    public ResponseEntity<RepositoryResponse> getRepositoryById(@PathVariable UUID id) {
        return ResponseEntity.ok(repositoryService.getRepositoryById(id));
    }

    @GetMapping(ApiEndpoints.REPOSITORY_BRANCHES)
    public ResponseEntity<List<String>> getBranches(@PathVariable UUID id) {
        return ResponseEntity.ok(repositoryService.getBranches(id));
    }

    @GetMapping(ApiEndpoints.REPOSITORY_DIFF)
    public ResponseEntity<Map<String, Object>> getDiff(
        @PathVariable UUID id,
        @RequestParam(defaultValue = "main") String base,
        @RequestParam(defaultValue = "HEAD") String target
    ) {
        return ResponseEntity.ok(repositoryService.getDiff(id, base, target));
    }

    @DeleteMapping(ApiEndpoints.REPOSITORY_BY_ID)
    public ResponseEntity<Void> deleteRepository(@PathVariable UUID id) {
        repositoryService.deleteRepository(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(ApiEndpoints.REPOSITORY_INDEX)
    public ResponseEntity<IndexStatusDto> triggerIndex(
        @PathVariable UUID id,
        @RequestParam(defaultValue = "false") boolean force
    ) {
        return ResponseEntity.accepted().body(indexingJobService.triggerReindex(id, force));
    }

    @GetMapping(ApiEndpoints.REPOSITORY_STATUS)
    public ResponseEntity<IndexStatusDto> getIndexStatus(@PathVariable UUID id) {
        return ResponseEntity.ok(indexingJobService.getStatus(id));
    }
}
