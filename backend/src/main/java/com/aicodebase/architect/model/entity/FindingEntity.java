package com.aicodebase.architect.model.entity;

import com.aicodebase.architect.model.enums.FindingCategory;
import com.aicodebase.architect.model.enums.FindingSeverity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "findings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FindingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "version_id", nullable = false)
    private RepositoryVersionEntity version;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private FindingCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FindingSeverity severity;

    @Column(nullable = false)
    private String title;

    @Column(name = "file_path", length = 1024)
    private String filePath;

    @Column(name = "line_number")
    private Integer lineNumber;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String finding;

    @Column(columnDefinition = "TEXT")
    private String evidence;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String recommendation;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
