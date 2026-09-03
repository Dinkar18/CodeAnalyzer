package com.aicodebase.architect.service;

import com.aicodebase.architect.dto.AnalyzeRequestDto;
import com.aicodebase.architect.dto.FindingDto;
import com.aicodebase.architect.exception.ResourceNotFoundException;
import com.aicodebase.architect.model.entity.FindingEntity;
import com.aicodebase.architect.model.entity.RepositoryEntity;
import com.aicodebase.architect.model.entity.RepositoryVersionEntity;
import com.aicodebase.architect.repository.FindingJpaRepository;
import com.aicodebase.architect.repository.RepositoryJpaRepository;
import com.aicodebase.architect.repository.RepositoryVersionJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalysisService {

    private final RepositoryJpaRepository repositoryJpaRepository;
    private final RepositoryVersionJpaRepository repositoryVersionJpaRepository;
    private final FindingJpaRepository findingJpaRepository;
    private final AiServiceClient aiServiceClient;

    @Transactional
    public List<FindingDto> runAnalysis(AnalyzeRequestDto request) {
        RepositoryEntity repo = repositoryJpaRepository.findById(request.repositoryId())
            .orElseThrow(() -> new ResourceNotFoundException("Repository not found with ID: " + request.repositoryId()));

        RepositoryVersionEntity latestVersion = repositoryVersionJpaRepository.findFirstByRepositoryIdOrderByIndexedAtDesc(repo.getId())
            .orElseThrow(() -> new ResourceNotFoundException("No indexed version found for repository " + repo.getId() + ". Please index the repository first."));

        List<FindingDto> findings = aiServiceClient.analyze(request);

        // Persist findings in database
        for (FindingDto dto : findings) {
            FindingEntity entity = FindingEntity.builder()
                .version(latestVersion)
                .category(dto.category())
                .severity(dto.severity())
                .title(dto.title())
                .filePath(dto.filePath())
                .lineNumber(dto.lineNumber())
                .finding(dto.finding())
                .evidence(dto.evidence())
                .recommendation(dto.recommendation())
                .build();
            findingJpaRepository.save(entity);
        }

        return findings;
    }

    @Transactional(readOnly = true)
    public List<FindingDto> getFindingsForRepository(UUID repositoryId) {
        Optional<RepositoryVersionEntity> latestVersionOpt = repositoryVersionJpaRepository.findFirstByRepositoryIdOrderByIndexedAtDesc(repositoryId);
        if (latestVersionOpt.isEmpty()) {
            return List.of();
        }

        return findingJpaRepository.findByVersionIdOrderBySeverityDesc(latestVersionOpt.get().getId()).stream()
            .map(f -> new FindingDto(
                f.getId(),
                f.getCategory(),
                f.getSeverity(),
                f.getTitle(),
                f.getFilePath(),
                f.getLineNumber(),
                f.getFinding(),
                f.getEvidence(),
                f.getRecommendation()
            ))
            .toList();
    }
}
