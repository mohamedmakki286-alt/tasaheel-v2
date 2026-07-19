package com.tasaheel.integration;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class EmailService {
    @Value("${RESEND_API_KEY:${application.resend.api-key:}}") private String apiKey;
    @Value("${application.email.from:Tasaheel <accounts@resend.dev>}") private String fromEmail;
    @Value("${application.workshop.url:http://localhost:3003}") private String workshopUrl;
    private final RestTemplate restTemplate = new RestTemplate();

    public void sendOtp(String email, String otp) {
        send(email, "رمز التحقق - تساهيل", page("رمز التحقق", "<h1>" + otp + "</h1><p>صالح لمدة 5 دقائق</p>"));
    }

    public void sendPasswordReset(String email, String token) {
        String url = workshopUrl + "/reset-password?token=" + token;
        send(email, "استعادة كلمة المرور - تساهيل", page("استعادة كلمة المرور",
                "<p>اضغط الزر لتعيين كلمة مرور جديدة.</p>" + button(url, "إعادة تعيين كلمة المرور") + "<p>الرابط صالح لمدة 30 دقيقة.</p>"));
    }

    public void sendWorkshopInvitation(String email, String workshopName, String token) {
        String url = workshopUrl + "/set-password?token=" + token;
        send(email, "إعداد حساب ورشتك في تساهيل", page("مرحباً بكم في تساهيل",
                "<p>تم إنشاء حساب " + workshopName + " بواسطة إدارة المنصة.</p>" + button(url, "إعداد كلمة المرور") + "<p>الرابط صالح لمدة 24 ساعة ويستخدم مرة واحدة.</p>"));
    }

    private String button(String url, String label) {
        return "<a href=\"" + url + "\" style=\"display:inline-block;background:#e51b23;color:#fff;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:bold\">" + label + "</a>";
    }

    private String page(String title, String content) {
        return "<!doctype html><html dir=\"rtl\"><meta charset=\"utf-8\"><body style=\"font-family:Arial;background:#f8fafc;padding:32px\"><div style=\"max-width:520px;margin:auto;background:white;padding:32px;border-radius:18px;border:1px solid #e2e8f0;text-align:center\"><h2>" + title + "</h2>" + content + "<p style=\"color:#94a3b8;font-size:12px\">تساهيل لصيانة السيارات</p></div></body></html>";
    }

    private void send(String to, String subject, String html) {
        if (apiKey == null || apiKey.isBlank()) {
            log.info("Email delivery disabled locally. Recipient: {}, subject: {}", to, subject);
            return;
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        headers.set("Idempotency-Key", "tasaheel-" + Integer.toHexString((to + subject + System.nanoTime()).hashCode()));
        Map<String, Object> body = Map.of("from", fromEmail, "to", List.of(to), "subject", subject, "html", html);
        ResponseEntity<Map> response = restTemplate.postForEntity("https://api.resend.com/emails", new HttpEntity<>(body, headers), Map.class);
        if (!response.getStatusCode().is2xxSuccessful()) throw new RuntimeException("Resend failed: " + response.getStatusCode());
        log.info("Email sent to {} via Resend", to);
    }
}
