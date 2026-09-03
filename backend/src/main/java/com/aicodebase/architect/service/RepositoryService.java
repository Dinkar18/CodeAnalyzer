package com.aicodebase.architect.service;

import com.aicodebase.architect.dto.RepositoryCreateRequest;
import com.aicodebase.architect.dto.RepositoryResponse;
import com.aicodebase.architect.exception.BusinessException;
import com.aicodebase.architect.exception.ResourceNotFoundException;
import com.aicodebase.architect.model.entity.RepositoryEntity;
import com.aicodebase.architect.model.entity.UserEntity;
import com.aicodebase.architect.model.enums.RepositoryStatus;
import com.aicodebase.architect.repository.RepositoryJpaRepository;
import com.aicodebase.architect.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RepositoryService {

    private final RepositoryJpaRepository repositoryJpaRepository;
    private final AiServiceClient aiServiceClient;
    private final CurrentUserService currentUserService;

    @Transactional
    public RepositoryResponse createRepository(RepositoryCreateRequest request) {
        log.info("Creating repository with URL: {}", request.url());

        UserEntity currentUser = currentUserService.getCurrentUserOrThrow();

        if (repositoryJpaRepository.existsByUrlAndUserId(request.url(), currentUser.getId())) {
            throw new BusinessException("You have already imported this repository: " + request.url());
        }

        RepositoryEntity entity = RepositoryEntity.builder()
            .user(currentUser)
            .name(request.name())
            .url(request.url())
            .defaultBranch(request.defaultBranch() != null ? request.defaultBranch() : "main")
            .description(request.description())
            .status(RepositoryStatus.PENDING)
            .build();

        RepositoryEntity saved = repositoryJpaRepository.save(entity);

        // Trigger initial indexing asynchronously
        try {
            aiServiceClient.triggerIndexing(saved.getId(), saved.getUrl(), saved.getDefaultBranch(), false);
            saved.setStatus(RepositoryStatus.INDEXING);
            repositoryJpaRepository.save(saved);
        } catch (Exception e) {
            log.warn("Asynchronous indexing trigger initial notice: {}", e.getMessage());
        }

        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<RepositoryResponse> getAllRepositories() {
        Optional<UserEntity> userOpt = currentUserService.getCurrentUser();
        if (userOpt.isEmpty()) {
            return List.of();
        }
        return repositoryJpaRepository.findByUserIdOrderByCreatedAtDesc(userOpt.get().getId()).stream()
            .map(this::mapToDto)
            .toList();
    }

    @Transactional(readOnly = true)
    public RepositoryResponse getRepositoryById(UUID id) {
        UserEntity currentUser = currentUserService.getCurrentUserOrThrow();
        RepositoryEntity entity = repositoryJpaRepository.findByIdAndUserId(id, currentUser.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Repository not found with ID: " + id));
        return mapToDto(entity);
    }

    @Transactional(readOnly = true)
    public List<String> getBranches(UUID id) {
        UserEntity currentUser = currentUserService.getCurrentUserOrThrow();
        if (!repositoryJpaRepository.findByIdAndUserId(id, currentUser.getId()).isPresent()) {
            throw new ResourceNotFoundException("Repository not found with ID: " + id);
        }
        return aiServiceClient.getBranches(id);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDiff(UUID id, String base, String target) {
        UserEntity currentUser = currentUserService.getCurrentUserOrThrow();
        if (!repositoryJpaRepository.findByIdAndUserId(id, currentUser.getId()).isPresent()) {
            throw new ResourceNotFoundException("Repository not found with ID: " + id);
        }
        return aiServiceClient.getDiff(id, base, target);
    }

    @Transactional
    public void deleteRepository(UUID id) {
        UserEntity currentUser = currentUserService.getCurrentUserOrThrow();
        RepositoryEntity entity = repositoryJpaRepository.findByIdAndUserId(id, currentUser.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Repository not found with ID: " + id));
        repositoryJpaRepository.delete(entity);
        log.info("Deleted repository {} for user {}", id, currentUser.getEmail());
    }

    private RepositoryResponse mapToDto(RepositoryEntity entity) {
        return new RepositoryResponse(
            entity.getId(),
            entity.getName(),
            entity.getUrl(),
            entity.getDefaultBranch(),
            entity.getStatus(),
            entity.getTechnologyStack(),
            entity.getApplicationType(),
            entity.getDescription(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }
}
