package com.aicodebase.architect.repository;

import com.aicodebase.architect.model.entity.FindingEntity;
import com.aicodebase.architect.model.enums.FindingCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FindingJpaRepository extends JpaRepository<FindingEntity, UUID> {
    List<FindingEntity> findByVersionIdOrderBySeverityDesc(UUID versionId);
    List<FindingEntity> findByVersionIdAndCategoryOrderBySeverityDesc(UUID versionId, FindingCategory category);
}
