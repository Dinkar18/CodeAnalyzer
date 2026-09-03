package com.aicodebase.architect.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "repository_files")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileMetadataEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "version_id", nullable = false)
    private RepositoryVersionEntity version;

    @Column(nullable = false, length = 1024)
    private String path;

    @Column(nullable = false)
    private String filename;

    @Column(length = 50)
    private String extension;

    @Column(length = 50)
    private String language;

    @Column(name = "size_bytes")
    @Builder.Default
    private Long sizeBytes = 0L;

    @Column(name = "line_count")
    @Builder.Default
    private Integer lineCount = 0;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "is_binary")
    @Builder.Default
    private Boolean isBinary = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
