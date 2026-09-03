package com.aicodebase.architect.controller;

import com.aicodebase.architect.constant.ApiEndpoints;
import com.aicodebase.architect.dto.AuthDtos.*;
import com.aicodebase.architect.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping(ApiEndpoints.AUTH)
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @GetMapping("/oauth/config")
    public ResponseEntity<OAuthConfigResponse> getOAuthConfig() {
        return ResponseEntity.ok(authService.getOAuthConfig());
    }

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signUp(@RequestBody SignUpRequest request) {
        return ResponseEntity.ok(authService.signUp(request));
    }

    @PostMapping("/signin")
    public ResponseEntity<AuthResponse> signIn(@RequestBody SignInRequest request) {
        return ResponseEntity.ok(authService.signIn(request));
    }

    @GetMapping("/verify-email")
    public ResponseEntity<AuthResponse> verifyEmail(@RequestParam String token) {
        return ResponseEntity.ok(authService.verifyEmail(token));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Map<String, String>> resendVerification(@RequestBody ResendVerificationRequest request) {
        authService.resendVerificationEmail(request.email());
        return ResponseEntity.ok(Map.of("message", "Verification email resent successfully."));
    }

    @PostMapping("/oauth/github/callback")
    public ResponseEntity<AuthResponse> githubCallback(@RequestBody OAuthCallbackRequest request) {
        return ResponseEntity.ok(authService.exchangeGitHubCode(request));
    }

    @PostMapping("/oauth/google/callback")
    public ResponseEntity<AuthResponse> googleCallback(@RequestBody OAuthCallbackRequest request) {
        return ResponseEntity.ok(authService.exchangeGoogleCode(request));
    }

    @PostMapping("/oauth/google")
    public ResponseEntity<AuthResponse> googleLogin(@RequestBody OAuthRequest request) {
        OAuthRequest enriched = new OAuthRequest(
            "GOOGLE",
            request.tokenOrCode(),
            request.email(),
            request.name(),
            request.avatarUrl(),
            request.providerId()
        );
        return ResponseEntity.ok(authService.oauthLogin(enriched));
    }

    @PostMapping("/oauth/github")
    public ResponseEntity<AuthResponse> githubLogin(@RequestBody OAuthRequest request) {
        OAuthRequest enriched = new OAuthRequest(
            "GITHUB",
            request.tokenOrCode(),
            request.email(),
            request.name(),
            request.avatarUrl(),
            request.providerId()
        );
        return ResponseEntity.ok(authService.oauthLogin(enriched));
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(@AuthenticationPrincipal String principal) {
        String identifier = principal != null ? principal : "architect-admin";
        return ResponseEntity.ok(authService.getProfileByEmailOrUsername(identifier));
    }
}
