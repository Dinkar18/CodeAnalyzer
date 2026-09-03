package com.aicodebase.architect.repository;

import com.aicodebase.architect.model.entity.CodeSymbolEntity;
import com.aicodebase.architect.model.enums.SymbolType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CodeSymbolJpaRepository extends JpaRepository<CodeSymbolEntity, UUID> {
    List<CodeSymbolEntity> findByVersionIdAndNameContainingIgnoreCase(UUID versionId, String name);
    List<CodeSymbolEntity> findByVersionIdAndSymbolType(UUID versionId, SymbolType symbolType);
}
