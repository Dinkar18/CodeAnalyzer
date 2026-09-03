package com.aicodebase.architect.repository;

import com.aicodebase.architect.model.entity.RepositoryVersionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RepositoryVersionJpaRepository extends JpaRepository<RepositoryVersionEntity, UUID> {
    Optional<RepositoryVersionEntity> findByRepositoryIdAndCommitSha(UUID repositoryId, String commitSha);
    Optional<RepositoryVersionEntity> findFirstByRepositoryIdOrderByIndexedAtDesc(UUID repositoryId);
    List<RepositoryVersionEntity> findByRepositoryIdOrderByIndexedAtDesc(UUID repositoryId);
}
