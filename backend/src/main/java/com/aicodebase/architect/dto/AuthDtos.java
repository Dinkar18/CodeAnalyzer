package com.aicodebase.architect.dto;

import com.aicodebase.architect.model.enums.AuthProvider;
import java.util.UUID;

public class AuthDtos {

    public record SignUpRequest(
        String email,
        String username,
        String password,
        String fullName
    ) {}

    public record SignInRequest(
        String emailOrUsername,
        String password
    ) {}

    public record OAuthRequest(
        String provider, // GOOGLE, GITHUB
        String tokenOrCode,
        String email,
        String name,
        String avatarUrl,
        String providerId
    ) {}

    public record OAuthCallbackRequest(
        String code,
        String redirectUri,
        String clientId,
        String clientSecret
    ) {}

    public record OAuthConfigResponse(
        String githubClientId,
        String googleClientId
    ) {}

    public record ResendVerificationRequest(
        String email
    ) {}

    public record AuthResponse(
        String token,
        String tokenType,
        long expiresIn,
        UserProfileResponse user,
        String message,
        String verificationToken
    ) {
        public AuthResponse(String token, String tokenType, long expiresIn, UserProfileResponse user) {
            this(token, tokenType, expiresIn, user, null, null);
        }

        public AuthResponse(String token, String tokenType, long expiresIn, UserProfileResponse user, String message) {
            this(token, tokenType, expiresIn, user, message, null);
        }
    }

    public record UserProfileResponse(
        UUID id,
        String email,
        String username,
        String fullName,
        String avatarUrl,
        AuthProvider provider,
        String role,
        boolean isEmailVerified
    ) {}
}
