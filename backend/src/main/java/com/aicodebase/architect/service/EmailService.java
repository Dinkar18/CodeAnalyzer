package com.aicodebase.architect.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import jakarta.mail.internet.MimeMessage;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    private final WebClient.Builder webClientBuilder;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${spring.mail.from:${spring.mail.username:noreply@aicodebase.architect}}")
    private String fromEmail;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${brevo.api-key:${BREVO_API_KEY:}}")
    private String brevoApiKey;

    @Value("${resend.api-key:${RESEND_API_KEY:}}")
    private String resendApiKey;

    public void sendVerificationEmail(String recipientEmail, String recipientName, String verificationToken) {
        String verificationUrl = frontendUrl + "/verify-email?token=" + verificationToken;

        log.info("================================================================================");
        log.info("📧 EMAIL DISPATCH [VERIFICATION]");
        log.info("To: {} ({})", recipientEmail, recipientName);
        log.info("From: {}", fromEmail);
        log.info("Verification URL: {}", verificationUrl);
        log.info("================================================================================");

        String htmlContent = """
            <!DOCTYPE html>
            <html>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #09090b; color: #f4f4f5; padding: 40px 20px;">
                <div style="max-width: 520px; margin: 0 auto; background-color: #121215; border: 1px solid #27272a; border-radius: 16px; padding: 32px;">
                    <h2 style="color: #6366f1; margin-top: 0; font-size: 20px; font-weight: bold;">AI Codebase Architect</h2>
                    <p style="color: #d4d4d8; font-size: 14px; line-height: 1.6;">
                        Hi %s,<br><br>
                        Thank you for creating an account. Please click the button below to verify your email address and activate your workspace.
                    </p>
                    <div style="margin: 32px 0; text-align: center;">
                        <a href="%s" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
                            Verify Email Address
                        </a>
                    </div>
                    <p style="color: #71717a; font-size: 12px; line-height: 1.5;">
                        If the button doesn't work, copy and paste this link into your browser:<br>
                        <a href="%s" style="color: #818cf8; word-break: break-all;">%s</a>
                    </p>
                    <p style="color: #52525b; font-size: 11px; margin-top: 32px; border-top: 1px solid #27272a; padding-top: 16px;">
                        This link expires in 24 hours. If you did not sign up, please ignore this email.
                    </p>
                </div>
            </body>
            </html>
            """.formatted(recipientName, verificationUrl, verificationUrl, verificationUrl);

        // 1. Check Brevo API Key
        String activeBrevoKey = !brevoApiKey.isBlank() ? brevoApiKey :
            (mailPassword != null && (mailPassword.startsWith("xkeysib-") || mailPassword.startsWith("xsmtpsib-"))) ? mailPassword : null;

        if (activeBrevoKey != null) {
            boolean success = sendViaBrevoApi(activeBrevoKey, recipientEmail, recipientName, htmlContent);
            if (success) return;
        }

        // 2. Check Resend API Key
        String activeResendKey = !resendApiKey.isBlank() ? resendApiKey :
            (mailPassword != null && mailPassword.startsWith("re_")) ? mailPassword : null;

        if (activeResendKey != null) {
            boolean success = sendViaResendApi(activeResendKey, recipientEmail, htmlContent);
            if (success) return;
        }

        // 3. Fallback to JavaMailSender (SMTP)
        if (mailSender == null) {
            log.info("SMTP JavaMailSender not configured. Email logged to console above.");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "AI Codebase Architect");
            helper.setTo(recipientEmail);
            helper.setSubject("Verify your AI Codebase Architect Account");
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Verification email successfully sent via SMTP to {}", recipientEmail);
        } catch (Exception e) {
            log.warn("Failed to send verification email via SMTP: {}. (Verification token is still active).", e.getMessage());
        }
    }

    private boolean sendViaBrevoApi(String apiKey, String recipientEmail, String recipientName, String htmlContent) {
        try {
            log.info("Dispatching email via Brevo HTTPS REST API (Port 443)...");
            WebClient webClient = webClientBuilder
                .baseUrl("https://api.brevo.com/v3")
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("api-key", apiKey)
                .build();

            Map<String, Object> payload = Map.of(
                "sender", Map.of(
                    "name", "AI Codebase Architect",
                    "email", fromEmail
                ),
                "to", List.of(
                    Map.of(
                        "email", recipientEmail,
                        "name", recipientName != null ? recipientName : "Developer"
                    )
                ),
                "subject", "Verify your AI Codebase Architect Account",
                "htmlContent", htmlContent
            );

            webClient.post()
                .uri("/smtp/email")
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(String.class)
                .block();

            log.info("✅ Verification email successfully delivered to {} via Brevo HTTPS API!", recipientEmail);
            return true;
        } catch (Exception e) {
            log.warn("Brevo HTTPS API delivery failed: {}. Falling back...", e.getMessage());
            return false;
        }
    }

    private boolean sendViaResendApi(String apiKey, String recipientEmail, String htmlContent) {
        try {
            log.info("Dispatching email via Resend HTTPS REST API (Port 443)...");
            WebClient webClient = webClientBuilder
                .baseUrl("https://api.resend.com")
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .build();

            Map<String, Object> payload = Map.of(
                "from", "AI Codebase Architect <onboarding@resend.dev>",
                "to", List.of(recipientEmail),
                "subject", "Verify your AI Codebase Architect Account",
                "html", htmlContent
            );

            webClient.post()
                .uri("/emails")
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(String.class)
                .block();

            log.info("✅ Verification email successfully delivered to {} via Resend HTTPS API!", recipientEmail);
            return true;
        } catch (Exception e) {
            log.warn("Resend HTTPS API delivery failed: {}. Falling back...", e.getMessage());
            return false;
        }
    }
}
