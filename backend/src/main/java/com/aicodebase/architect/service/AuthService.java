package com.aicodebase.architect.service;

import com.aicodebase.architect.dto.AuthDtos.*;
import com.aicodebase.architect.exception.BusinessException;
import com.aicodebase.architect.exception.ResourceNotFoundException;
import com.aicodebase.architect.model.entity.UserEntity;
import com.aicodebase.architect.model.enums.AuthProvider;
import com.aicodebase.architect.repository.UserJpaRepository;
import com.aicodebase.architect.security.JwtTokenProvider;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserJpaRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmailService emailService;
    private final ObjectMapper objectMapper;

    @Value("${github.client-id:}")
    private String githubClientId;

    @Value("${github.client-secret:}")
    private String githubClientSecret;

    @Value("${google.client-id:}")
    private String googleClientId;

    @Value("${google.client-secret:}")
    private String googleClientSecret;

    public OAuthConfigResponse getOAuthConfig() {
        return new OAuthConfigResponse(githubClientId, googleClientId);
    }

    @Transactional
    public AuthResponse signUp(SignUpRequest request) {
        if (request.email() == null || request.email().isBlank()) {
            throw new BusinessException("Email is required");
        }
        if (request.password() == null || request.password().length() < 6) {
            throw new BusinessException("Password must be at least 6 characters");
        }
        if (userRepository.existsByEmail(request.email().trim().toLowerCase())) {
            throw new BusinessException("An account with this email already exists");
        }

        String username = request.username() != null && !request.username().isBlank()
            ? request.username().trim()
            : request.email().split("@")[0];

        if (userRepository.existsByUsername(username)) {
            username = username + "_" + System.currentTimeMillis() % 10000;
        }

        String verificationToken = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");

        UserEntity user = UserEntity.builder()
            .email(request.email().trim().toLowerCase())
            .username(username)
            .passwordHash(passwordEncoder.encode(request.password()))
            .fullName(request.fullName() != null ? request.fullName().trim() : username)
            .avatarUrl("https://api.dicebear.com/7.x/bottts/svg?seed=" + username)
            .provider(AuthProvider.LOCAL)
            .role("ROLE_DEVELOPER")
            .isEmailVerified(false)
            .verificationToken(verificationToken)
            .verificationTokenExpiresAt(LocalDateTime.now().plusHours(24))
            .build();

        user = userRepository.save(user);

        // Dispatch verification email
        emailService.sendVerificationEmail(user.getEmail(), user.getFullName(), verificationToken);

        String token = jwtTokenProvider.generateToken(user.getEmail(), "primary-org", user.getRole());
        return new AuthResponse(
            token,
            "Bearer",
            86400,
            toProfileResponse(user),
            "Account created! We've sent a verification link to " + user.getEmail(),
            verificationToken
        );
    }

    @Transactional
    public AuthResponse verifyEmail(String verificationToken) {
        if (verificationToken == null || verificationToken.isBlank()) {
            throw new BusinessException("Verification token is required");
        }

        UserEntity user = userRepository.findByVerificationToken(verificationToken)
            .orElseThrow(() -> new BusinessException("Invalid or expired verification token"));

        if (user.getVerificationTokenExpiresAt() != null && user.getVerificationTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Verification token has expired. Please request a new one.");
        }

        user.setIsEmailVerified(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiresAt(null);
        user = userRepository.save(user);

        String token = jwtTokenProvider.generateToken(user.getEmail(), "primary-org", user.getRole());
        return new AuthResponse(token, "Bearer", 86400, toProfileResponse(user), "Email verified successfully!");
    }

    @Transactional
    public void resendVerificationEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new BusinessException("Email is required");
        }

        UserEntity user = userRepository.findByEmail(email.trim().toLowerCase())
            .orElseThrow(() -> new ResourceNotFoundException("No account found with email: " + email));

        if (Boolean.TRUE.equals(user.getIsEmailVerified())) {
            throw new BusinessException("This account is already verified.");
        }

        String verificationToken = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
        user.setVerificationToken(verificationToken);
        user.setVerificationTokenExpiresAt(LocalDateTime.now().plusHours(24));
        userRepository.save(user);

        emailService.sendVerificationEmail(user.getEmail(), user.getFullName(), verificationToken);
    }

    @Transactional(readOnly = true)
    public AuthResponse signIn(SignInRequest request) {
        if (request.emailOrUsername() == null || request.password() == null) {
            throw new BusinessException("Email and password are required");
        }

        String query = request.emailOrUsername().trim();
        UserEntity user = userRepository.findByEmail(query.toLowerCase())
            .or(() -> userRepository.findByUsername(query))
            .orElseThrow(() -> new BusinessException("Invalid email/username or password"));

        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BusinessException("Invalid email/username or password");
        }

        if (Boolean.FALSE.equals(user.getIsEmailVerified())) {
            throw new BusinessException("Your email address is not verified yet. Please check your inbox and click the verification link to activate your account.");
        }

        String token = jwtTokenProvider.generateToken(user.getEmail(), "primary-org", user.getRole());
        return new AuthResponse(token, "Bearer", 86400, toProfileResponse(user));
    }

    @Transactional
    public AuthResponse exchangeGitHubCode(OAuthCallbackRequest request) {
        if (request.code() == null || request.code().isBlank()) {
            throw new BusinessException("GitHub OAuth code is required");
        }

        String effectiveClientId = (request.clientId() != null && !request.clientId().isBlank())
            ? request.clientId()
            : githubClientId;

        String effectiveClientSecret = (request.clientSecret() != null && !request.clientSecret().isBlank())
            ? request.clientSecret()
            : githubClientSecret;

        if (effectiveClientId == null || effectiveClientId.isBlank() || effectiveClientSecret == null || effectiveClientSecret.isBlank()) {
            throw new BusinessException("GitHub OAuth credentials not configured on server or in request.");
        }

        try {
            // 1. Exchange code for access token
            WebClient webClient = WebClient.create();
            String tokenResponse = webClient.post()
                .uri("https://github.com/login/oauth/access_token")
                .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .bodyValue(Map.of(
                    "client_id", effectiveClientId,
                    "client_secret", effectiveClientSecret,
                    "code", request.code()
                ))
                .retrieve()
                .bodyToMono(String.class)
                .block();

            JsonNode tokenJson = objectMapper.readTree(tokenResponse);
            String accessToken = tokenJson.path("access_token").asText(null);
            if (accessToken == null) {
                throw new BusinessException("GitHub OAuth failed: " + tokenJson.path("error_description").asText("Invalid authorization code"));
            }

            // 2. Fetch User Profile from GitHub
            String userProfileResponse = webClient.get()
                .uri("https://api.github.com/user")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .header(HttpHeaders.USER_AGENT, "AICodebaseArchitect")
                .retrieve()
                .bodyToMono(String.class)
                .block();

            JsonNode profileJson = objectMapper.readTree(userProfileResponse);
            String githubId = profileJson.path("id").asText();
            String username = profileJson.path("login").asText();
            String name = profileJson.path("name").asText(username);
            String avatarUrl = profileJson.path("avatar_url").asText();
            String email = profileJson.path("email").asText(null);

            // If email is private, fetch from /user/emails
            if (email == null || email.isBlank() || "null".equals(email)) {
                try {
                    String emailsResponse = webClient.get()
                        .uri("https://api.github.com/user/emails")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                        .header(HttpHeaders.USER_AGENT, "AICodebaseArchitect")
                        .retrieve()
                        .bodyToMono(String.class)
                        .block();

                    JsonNode emailsJson = objectMapper.readTree(emailsResponse);
                    if (emailsJson.isArray() && emailsJson.size() > 0) {
                        for (JsonNode eNode : emailsJson) {
                            if (eNode.path("primary").asBoolean(false)) {
                                email = eNode.path("email").asText();
                                break;
                            }
                        }
                        if (email == null) email = emailsJson.get(0).path("email").asText();
                    }
                } catch (Exception ex) {
                    log.warn("Failed to fetch GitHub private emails: {}", ex.getMessage());
                }
            }

            return oauthLogin(new OAuthRequest(
                "GITHUB",
                accessToken,
                email,
                name,
                avatarUrl,
                githubId
            ));
        } catch (Exception e) {
            log.error("GitHub OAuth exchange failed: {}", e.getMessage());
            throw new BusinessException("GitHub OAuth exchange failed: " + e.getMessage(), e);
        }
    }

    @Transactional
    public AuthResponse exchangeGoogleCode(OAuthCallbackRequest request) {
        if (request.code() == null || request.code().isBlank()) {
            throw new BusinessException("Google OAuth code is required");
        }

        String effectiveClientId = (request.clientId() != null && !request.clientId().isBlank())
            ? request.clientId()
            : googleClientId;

        String effectiveClientSecret = (request.clientSecret() != null && !request.clientSecret().isBlank())
            ? request.clientSecret()
            : googleClientSecret;

        if (effectiveClientId == null || effectiveClientId.isBlank() || effectiveClientSecret == null || effectiveClientSecret.isBlank()) {
            throw new BusinessException("Google OAuth credentials not configured on server or in request.");
        }

        try {
            WebClient webClient = WebClient.create();
            String tokenResponse = webClient.post()
                .uri("https://oauth2.googleapis.com/token")
                .bodyValue(Map.of(
                    "client_id", effectiveClientId,
                    "client_secret", effectiveClientSecret,
                    "code", request.code(),
                    "grant_type", "authorization_code",
                    "redirect_uri", request.redirectUri() != null ? request.redirectUri() : "http://localhost:3000/oauth/callback"
                ))
                .retrieve()
                .bodyToMono(String.class)
                .block();

            JsonNode tokenJson = objectMapper.readTree(tokenResponse);
            String accessToken = tokenJson.path("access_token").asText(null);
            if (accessToken == null) {
                throw new BusinessException("Google OAuth failed: " + tokenJson.path("error_description").asText("Invalid authorization code"));
            }

            String userProfileResponse = webClient.get()
                .uri("https://www.googleapis.com/oauth2/v3/userinfo")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .retrieve()
                .bodyToMono(String.class)
                .block();

            JsonNode profileJson = objectMapper.readTree(userProfileResponse);
            String googleId = profileJson.path("sub").asText();
            String name = profileJson.path("name").asText("Google User");
            String email = profileJson.path("email").asText();
            String avatarUrl = profileJson.path("picture").asText();

            return oauthLogin(new OAuthRequest(
                "GOOGLE",
                accessToken,
                email,
                name,
                avatarUrl,
                googleId
            ));
        } catch (Exception e) {
            log.error("Google OAuth exchange failed: {}", e.getMessage());
            throw new BusinessException("Google OAuth exchange failed: " + e.getMessage(), e);
        }
    }

    @Transactional
    public AuthResponse oauthLogin(OAuthRequest request) {
        if (request.provider() == null) {
            throw new BusinessException("OAuth provider is required");
        }

        AuthProvider provider;
        try {
            provider = AuthProvider.valueOf(request.provider().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Unsupported OAuth provider: " + request.provider());
        }

        String email = request.email() != null && !request.email().isBlank()
            ? request.email().trim().toLowerCase()
            : (request.providerId() != null ? request.providerId() + "@" + provider.name().toLowerCase() + ".oauth" : "user_" + System.currentTimeMillis() + "@oauth.local");

        Optional<UserEntity> existingUser = userRepository.findByEmail(email);

        UserEntity user;
        if (existingUser.isPresent()) {
            user = existingUser.get();
            if (request.avatarUrl() != null) {
                user.setAvatarUrl(request.avatarUrl());
            }
            if (request.name() != null) {
                user.setFullName(request.name());
            }
            user.setIsEmailVerified(true);
            user = userRepository.save(user);
        } else {
            String username = request.name() != null && !request.name().isBlank()
                ? request.name().replaceAll("\\s+", "_").toLowerCase()
                : email.split("@")[0];

            if (userRepository.existsByUsername(username)) {
                username = username + "_" + System.currentTimeMillis() % 10000;
            }

            user = UserEntity.builder()
                .email(email)
                .username(username)
                .fullName(request.name() != null ? request.name() : username)
                .avatarUrl(request.avatarUrl() != null ? request.avatarUrl() : "https://api.dicebear.com/7.x/bottts/svg?seed=" + username)
                .provider(provider)
                .providerId(request.providerId())
                .role("ROLE_DEVELOPER")
                .isEmailVerified(true)
                .build();

            user = userRepository.save(user);
        }

        String token = jwtTokenProvider.generateToken(user.getEmail(), "primary-org", user.getRole());
        return new AuthResponse(token, "Bearer", 86400, toProfileResponse(user));
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfileByEmailOrUsername(String identifier) {
        UserEntity user = userRepository.findByEmail(identifier.toLowerCase())
            .or(() -> userRepository.findByUsername(identifier))
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + identifier));

        return toProfileResponse(user);
    }

    private UserProfileResponse toProfileResponse(UserEntity user) {
        return new UserProfileResponse(
            user.getId(),
            user.getEmail(),
            user.getUsername(),
            user.getFullName(),
            user.getAvatarUrl(),
            user.getProvider(),
            user.getRole(),
            Boolean.TRUE.equals(user.getIsEmailVerified())
        );
    }
}
