package com.aicodebase.architect.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "repository_versions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RepositoryVersionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repository_id", nullable = false)
    private RepositoryEntity repository;

    @Column(name = "commit_sha", nullable = false, length = 64)
    private String commitSha;

    @CreationTimestamp
    @Column(name = "indexed_at", nullable = false)
    private Instant indexedAt;

    @Column(name = "file_count")
    @Builder.Default
    private Integer fileCount = 0;

    @Column(name = "symbol_count")
    @Builder.Default
    private Integer symbolCount = 0;

    @Column(name = "chunk_count")
    @Builder.Default
    private Integer chunkCount = 0;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "READY";
}
