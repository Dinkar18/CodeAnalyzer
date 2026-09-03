package com.aicodebase.architect.repository;

import com.aicodebase.architect.model.entity.ConversationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationJpaRepository extends JpaRepository<ConversationEntity, UUID> {
    List<ConversationEntity> findByRepositoryIdOrderByCreatedAtDesc(UUID repositoryId);
    List<ConversationEntity> findByRepositoryIdAndUserIdOrderByCreatedAtDesc(UUID repositoryId, UUID userId);
    Optional<ConversationEntity> findByIdAndUserId(UUID id, UUID userId);
}
