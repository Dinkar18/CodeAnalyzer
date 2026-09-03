package com.aicodebase.architect.service;

import com.aicodebase.architect.dto.IndexStatusDto;
import com.aicodebase.architect.exception.ResourceNotFoundException;
import com.aicodebase.architect.model.entity.RepositoryEntity;
import com.aicodebase.architect.model.enums.RepositoryStatus;
import com.aicodebase.architect.repository.RepositoryJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class IndexingJobService {

    private final RepositoryJpaRepository repositoryJpaRepository;
    private final AiServiceClient aiServiceClient;

    @Transactional
    public IndexStatusDto triggerReindex(UUID repositoryId, boolean force) {
        RepositoryEntity repo = repositoryJpaRepository.findById(repositoryId)
            .orElseThrow(() -> new ResourceNotFoundException("Repository not found with ID: " + repositoryId));

        repo.setStatus(RepositoryStatus.INDEXING);
        repositoryJpaRepository.save(repo);

        return aiServiceClient.triggerIndexing(repo.getId(), repo.getUrl(), repo.getDefaultBranch(), force);
    }

    @Transactional(readOnly = true)
    public IndexStatusDto getStatus(UUID repositoryId) {
        if (!repositoryJpaRepository.existsById(repositoryId)) {
            throw new ResourceNotFoundException("Repository not found with ID: " + repositoryId);
        }

        IndexStatusDto status = aiServiceClient.getIndexStatus(repositoryId);
        if (status == null) {
            RepositoryEntity repo = repositoryJpaRepository.findById(repositoryId).get();
            return new IndexStatusDto(
                repositoryId,
                repo.getStatus(),
                repo.getStatus() == RepositoryStatus.READY ? 100 : 0,
                repo.getStatus().name(),
                null,
                0, 0, 0
            );
        }
        return status;
    }
}
