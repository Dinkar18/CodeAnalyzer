package com.aicodebase.architect.service;

import com.aicodebase.architect.dto.RepositoryCreateRequest;
import com.aicodebase.architect.dto.RepositoryResponse;
import com.aicodebase.architect.exception.BusinessException;
import com.aicodebase.architect.exception.ResourceNotFoundException;
import com.aicodebase.architect.model.entity.RepositoryEntity;
import com.aicodebase.architect.model.enums.RepositoryStatus;
import com.aicodebase.architect.repository.RepositoryJpaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RepositoryServiceTest {

    @Mock
    private RepositoryJpaRepository repositoryJpaRepository;

    @Mock
    private AiServiceClient aiServiceClient;

    @InjectMocks
    private RepositoryService repositoryService;

    private UUID sampleId;
    private RepositoryEntity sampleEntity;

    @BeforeEach
    void setUp() {
        sampleId = UUID.randomUUID();
        sampleEntity = RepositoryEntity.builder()
            .id(sampleId)
            .name("petclinic")
            .url("https://github.com/spring-projects/spring-petclinic.git")
            .defaultBranch("main")
            .status(RepositoryStatus.READY)
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();
    }

    @Test
    @DisplayName("Should successfully create a new repository and trigger indexing")
    void createRepository_Success() {
        RepositoryCreateRequest request = new RepositoryCreateRequest(
            "petclinic",
            "https://github.com/spring-projects/spring-petclinic.git",
            "main",
            "Spring PetClinic sample application"
        );

        when(repositoryJpaRepository.existsByUrl(request.url())).thenReturn(false);
        when(repositoryJpaRepository.save(any(RepositoryEntity.class))).thenReturn(sampleEntity);

        RepositoryResponse response = repositoryService.createRepository(request);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(sampleId);
        assertThat(response.name()).isEqualTo("petclinic");
        verify(repositoryJpaRepository, atLeastOnce()).save(any(RepositoryEntity.class));
    }

    @Test
    @DisplayName("Should throw BusinessException when creating repository with duplicate URL")
    void createRepository_DuplicateUrl_ThrowsException() {
        RepositoryCreateRequest request = new RepositoryCreateRequest(
            "duplicate",
            "https://github.com/spring-projects/spring-petclinic.git",
            "main",
            null
        );

        when(repositoryJpaRepository.existsByUrl(request.url())).thenReturn(true);

        assertThatThrownBy(() -> repositoryService.createRepository(request))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("already been registered");

        verify(repositoryJpaRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should retrieve repository by ID")
    void getRepositoryById_Success() {
        when(repositoryJpaRepository.findById(sampleId)).thenReturn(Optional.of(sampleEntity));

        RepositoryResponse response = repositoryService.getRepositoryById(sampleId);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(sampleId);
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when repository ID not found")
    void getRepositoryById_NotFound() {
        when(repositoryJpaRepository.findById(sampleId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> repositoryService.getRepositoryById(sampleId))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("Repository not found with ID");
    }
}
