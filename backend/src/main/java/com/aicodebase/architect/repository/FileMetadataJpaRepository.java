package com.aicodebase.architect.repository;

import com.aicodebase.architect.model.entity.FileMetadataEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FileMetadataJpaRepository extends JpaRepository<FileMetadataEntity, UUID> {
    List<FileMetadataEntity> findByVersionIdOrderByPathAsc(UUID versionId);
    Optional<FileMetadataEntity> findByVersionIdAndPath(UUID versionId, String path);
}
