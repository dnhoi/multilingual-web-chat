package com.example.identity.service;

import brevo.ApiClient;
import brevo.Configuration;
import brevo.auth.ApiKeyAuth;
import brevoApi.TransactionalEmailsApi;

import brevoModel.CreateSmtpEmail;
import brevoModel.SendSmtpEmail;
import brevoModel.SendSmtpEmailSender;
import brevoModel.SendSmtpEmailTo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
public class EmailService {
    private final TransactionalEmailsApi api;
    private final String fromEmail;

    public EmailService(@Value("${BREVO_API_KEY}") String apiKey,
                        @Value("${FROM_EMAIL}") String fromEmail) {
        ApiClient client = Configuration.getDefaultApiClient();
        client.setBasePath("https://api.brevo.com/v3");
        ApiKeyAuth key = (ApiKeyAuth) client.getAuthentication("api-key");
        key.setApiKey(apiKey);
        this.api = new TransactionalEmailsApi(client);
        this.fromEmail = fromEmail;
    }

    public void sendResetCode(String toEmail, String code) throws Exception {
        String subject = "Password reset confirmation code";
        String html = """
            <div style="font-family: Arial, sans-serif; font-size: 14px;">
                <p>Your code will expire in <strong>5 minutes</strong>.</p>
                <p>Your verification code is:</p>
                <p style="font-size: 24px; font-weight: bold; color: #2d3748;">%s</p>
            </div>
        """.formatted(code);
        sendHtml(toEmail, subject, html);
    }

    public void sendActivationLink(String toEmail, String username, String activationUrl) throws Exception {
        String subject = "Activate your Multichat account";
        String html = """
            <div style="font-family: Arial, sans-serif; font-size: 14px;">
                <p>Xin chào <strong>%s</strong>,</p>
                <p>Cảm ơn bạn đã đăng ký tài khoản Multichat.</p>
                <p>Vui lòng nhấn vào liên kết dưới đây để kích hoạt tài khoản (hiệu lực <strong>%d giờ</strong>):</p>
                <p><a href="%s" style="display:inline-block;padding:10px 15px;background-color:#3182ce;color:#fff;text-decoration:none;border-radius:4px;">Kích hoạt tài khoản</a></p>
                <p>Nếu bạn không đăng ký tài khoản, vui lòng bỏ qua email này.</p>
                <p>Trân trọng,<br/>Multichat Team</p>
            </div>
        """.formatted(username != null ? username : "bạn", 24, activationUrl);
        sendHtml(toEmail, subject, html);
    }

    public void sendResetPasswordLink(String toEmail, String username, String resetUrl) throws Exception {
        String subject = "Reset your Multichat password";
        String html = """
            <div style="font-family: Arial, sans-serif; font-size: 14px;">
                <p>Xin chào <strong>%s</strong>,</p>
                <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản Multichat của bạn.</p>
                <p>Vui lòng nhấn vào liên kết dưới đây để tiến hành tạo mật khẩu mới:</p>
                <p><a href="%s" style="display:inline-block;padding:10px 15px;background-color:#e53e3e;color:#fff;text-decoration:none;border-radius:4px;">Đặt lại mật khẩu</a></p>
                <p>Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email này và bảo mật tài khoản của bạn.</p>
                <p>Trân trọng,<br/>Multichat Team</p>
            </div>
        """.formatted(username != null ? username : "bạn", resetUrl);
        sendHtml(toEmail, subject, html);
    }

    private void sendHtml(String toEmail, String subject, String html) throws Exception {
        SendSmtpEmailSender sender = new SendSmtpEmailSender().email(fromEmail);
        SendSmtpEmailTo to = new SendSmtpEmailTo().email(toEmail);

        SendSmtpEmail mail = new SendSmtpEmail()
                .sender(sender)
                .to(List.of(to))
                .subject(subject)
                .htmlContent(html);

        try {
            CreateSmtpEmail resp = api.sendTransacEmail(mail);
            log.info("Brevo sent: messageId={}", resp.getMessageId());
        } catch (brevo.ApiException e) {
            log.error("Brevo ApiException code={} body={} headers={}",
                    e.getCode(), e.getResponseBody(), e.getResponseHeaders());
            throw e;
        }
    }
}
