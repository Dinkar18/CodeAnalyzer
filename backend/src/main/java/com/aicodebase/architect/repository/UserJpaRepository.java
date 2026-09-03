package com.aicodebase.architect.repository;

import com.aicodebase.architect.model.entity.UserEntity;
import com.aicodebase.architect.model.enums.AuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserJpaRepository extends JpaRepository<UserEntity, UUID> {
    Optional<UserEntity> findByEmail(String email);
    Optional<UserEntity> findByUsername(String username);
    Optional<UserEntity> findByProviderAndProviderId(AuthProvider provider, String providerId);
    Optional<UserEntity> findByVerificationToken(String verificationToken);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
}
