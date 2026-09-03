package com.aicodebase.architect.model.entity;

import com.aicodebase.architect.model.enums.RepositoryStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "repositories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RepositoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private UserEntity user;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 512)
    private String url;

    @Column(name = "default_branch", length = 100)
    @Builder.Default
    private String defaultBranch = "main";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private RepositoryStatus status = RepositoryStatus.PENDING;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "technology_stack", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> technologyStack = new ArrayList<>();

    @Column(name = "application_type", length = 100)
    private String applicationType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
