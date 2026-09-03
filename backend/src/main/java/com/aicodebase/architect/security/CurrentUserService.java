package com.aicodebase.architect.security;

import com.aicodebase.architect.exception.UnauthorizedException;
import com.aicodebase.architect.model.entity.UserEntity;
import com.aicodebase.architect.repository.UserJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final UserJpaRepository userRepository;

    public Optional<UserEntity> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equalsIgnoreCase(auth.getName())) {
            return Optional.empty();
        }
        String principal = auth.getName();
        return userRepository.findByEmail(principal.toLowerCase())
            .or(() -> userRepository.findByUsername(principal));
    }

    public UserEntity getCurrentUserOrThrow() {
        return getCurrentUser().orElseThrow(() -> 
            new UnauthorizedException("Your session is invalid or has expired. Please sign in again."));
    }
}
