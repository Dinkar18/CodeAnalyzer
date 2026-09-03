package com.aicodebase.architect.controller;

import com.aicodebase.architect.constant.ApiEndpoints;
import com.aicodebase.architect.exception.ResourceNotFoundException;
import com.aicodebase.architect.model.entity.FileMetadataEntity;
import com.aicodebase.architect.model.entity.RepositoryVersionEntity;
import com.aicodebase.architect.repository.FileMetadataJpaRepository;
import com.aicodebase.architect.repository.RepositoryVersionJpaRepository;
import com.aicodebase.architect.service.AiServiceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping(ApiEndpoints.FILES)
@RequiredArgsConstructor
public class FileController {

    private final RepositoryVersionJpaRepository repositoryVersionJpaRepository;
    private final FileMetadataJpaRepository fileMetadataJpaRepository;
    private final AiServiceClient aiServiceClient;

    @GetMapping(ApiEndpoints.FILES_BY_REPO)
    public ResponseEntity<List<Map<String, Object>>> listFiles(@PathVariable UUID repositoryId) {
        Optional<RepositoryVersionEntity> versionOpt = repositoryVersionJpaRepository.findFirstByRepositoryIdOrderByIndexedAtDesc(repositoryId);
        if (versionOpt.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        List<Map<String, Object>> files = fileMetadataJpaRepository.findByVersionIdOrderByPathAsc(versionOpt.get().getId()).stream()
            .map(f -> Map.<String, Object>of(
                "id", f.getId(),
                "path", f.getPath(),
                "filename", f.getFilename(),
                "language", f.getLanguage() != null ? f.getLanguage() : "",
                "lineCount", f.getLineCount(),
                "sizeBytes", f.getSizeBytes()
            ))
            .toList();

        return ResponseEntity.ok(files);
    }

    @GetMapping(ApiEndpoints.FILE_CONTENT)
    public ResponseEntity<Map<String, Object>> getFileContent(
        @PathVariable UUID repositoryId,
        @RequestParam String path
    ) {
        RepositoryVersionEntity latestVersion = repositoryVersionJpaRepository.findFirstByRepositoryIdOrderByIndexedAtDesc(repositoryId)
            .orElseThrow(() -> new ResourceNotFoundException("No indexed version found for repository " + repositoryId));

        FileMetadataEntity file = fileMetadataJpaRepository.findByVersionIdAndPath(latestVersion.getId(), path)
            .orElseThrow(() -> new ResourceNotFoundException("File '" + path + "' not found in repository " + repositoryId));

        return ResponseEntity.ok(Map.of(
            "path", file.getPath(),
            "language", file.getLanguage() != null ? file.getLanguage() : "",
            "lineCount", file.getLineCount(),
            "content", file.getContent() != null ? file.getContent() : ""
        ));
    }

    @GetMapping(ApiEndpoints.FILE_GRAPH)
    public ResponseEntity<Map<String, Object>> getGraph(@PathVariable UUID repositoryId) {
        return ResponseEntity.ok(aiServiceClient.getGraph(repositoryId));
    }
}
