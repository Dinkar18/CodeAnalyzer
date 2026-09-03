package com.aicodebase.architect.repository;

import com.aicodebase.architect.model.entity.RepositoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RepositoryJpaRepository extends JpaRepository<RepositoryEntity, UUID> {
    Optional<RepositoryEntity> findByUrl(String url);
    boolean existsByUrl(String url);

    List<RepositoryEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<RepositoryEntity> findByIdAndUserId(UUID id, UUID userId);
    Optional<RepositoryEntity> findByUrlAndUserId(String url, UUID userId);
    boolean existsByUrlAndUserId(String url, UUID userId);
}
