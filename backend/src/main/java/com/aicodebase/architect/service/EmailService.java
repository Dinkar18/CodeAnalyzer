package com.aicodebase.architect.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${spring.mail.from:${spring.mail.username:noreply@aicodebase.architect}}")
    private String fromEmail;

    public void sendVerificationEmail(String recipientEmail, String recipientName, String verificationToken) {
        String verificationUrl = frontendUrl + "/verify-email?token=" + verificationToken;

        log.info("================================================================================");
        log.info("📧 EMAIL DISPATCH [VERIFICATION]");
        log.info("To: {} ({})", recipientEmail, recipientName);
        log.info("From: {}", fromEmail);
        log.info("Verification URL: {}", verificationUrl);
        log.info("================================================================================");

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

            String htmlContent = """
                <!DOCTYPE html>
                <html>
                <body style="font-family: Arial, sans-serif; background-color: #060912; color: #f8fafc; padding: 40px 20px;">
                    <div style="max-width: 520px; margin: 0 auto; background-color: #0B1020; border: 1px solid #1e293b; border-radius: 16px; padding: 32px;">
                        <h2 style="color: #6366f1; margin-top: 0;">Welcome to AI Codebase Architect</h2>
                        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
                            Hi %s,<br><br>
                            Thank you for creating an account. Please click the button below to verify your email address and activate your workspace.
                        </p>
                        <div style="margin: 32px 0; text-align: center;">
                            <a href="%s" style="background-color: #6366f1; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
                                Verify Email Address
                            </a>
                        </div>
                        <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
                            If the button doesn't work, copy and paste this link into your browser:<br>
                            <a href="%s" style="color: #818cf8; word-break: break-all;">%s</a>
                        </p>
                        <p style="color: #475569; font-size: 11px; margin-top: 32px; border-top: 1px solid #1e293b; padding-top: 16px;">
                            This link expires in 24 hours. If you did not sign up, please ignore this email.
                        </p>
                    </div>
                </body>
                </html>
                """.formatted(recipientName, verificationUrl, verificationUrl, verificationUrl);

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Verification email successfully sent to {}", recipientEmail);
        } catch (Exception e) {
            log.warn("Failed to send verification email via SMTP: {}. (Verification token is still active).", e.getMessage());
        }
    }
}
