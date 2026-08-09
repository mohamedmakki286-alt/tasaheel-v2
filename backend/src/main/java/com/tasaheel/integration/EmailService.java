package com.tasaheel.integration;

import com.tasaheel.exception.EmailDeliveryException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

/** The single outbound-email gateway. Delivery is provided by Brevo SMTP. */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    private static final String UTF_8 = StandardCharsets.UTF_8.name();

    private final JavaMailSender mailSender;

    @Value("${application.email.enabled:false}") private boolean enabled;
    @Value("${application.email.from:noreply@salabaa.com}") private String fromEmail;
    @Value("${application.email.from-name:تساهيل}") private String fromName;
    @Value("${application.email.customer-url:http://localhost:3201}") private String customerUrl;
    @Value("${application.email.workshop-url:http://localhost:3102}") private String workshopUrl;
    @Value("${spring.mail.username:}") private String smtpUsername;
    @Value("${application.email.admin-url:http://localhost:3103}") private String adminUrl;

    public void sendOtp(String email, String otp) {
        sendHtml(email, "رمز التحقق - تساهيل", template("رمز التحقق", "استخدم الرمز التالي لإكمال التحقق من بريدك الإلكتروني.",
                "<div style=\"font-size:32px;font-weight:800;letter-spacing:8px;color:#d90408;margin:24px 0\">" + escape(otp) + "</div>"
                        + "<p style=\"color:#64748b\">الرمز صالح لمدة 10 دقائق ولا يمكن استخدامه أكثر من مرة.</p>"));
    }

    public void sendPasswordReset(String email, String code) {
        sendHtml(email, "رمز استعادة كلمة المرور - تساهيل", template("استعادة كلمة المرور",
                "استخدم الرمز التالي داخل تطبيق تساهيل لتعيين كلمة مرور جديدة.",
                "<div style=\"font-size:32px;font-weight:800;letter-spacing:8px;color:#d90408;margin:24px 0\">" + escape(code) + "</div>"
                        + "<p style=\"color:#64748b\">الرمز صالح لمدة 10 دقائق ويستخدم مرة واحدة. تجاهل الرسالة إذا لم تطلب ذلك.</p>"));
    }

    public void sendPasswordChanged(String email) {
        sendHtml(email, "تم تغيير كلمة المرور - تساهيل", template("تم تغيير كلمة المرور بنجاح",
                "تم تحديث كلمة مرور حسابك. إذا لم تقم بهذا الإجراء فتواصل مع الدعم فوراً.", ""));
    }

    public void sendWorkshopInvitation(String email, String workshopName, String token) {
        String url = workshopUrl + "/set-password?token=" + encodeToken(token);
        sendHtml(email, "إعداد حساب ورشتك في تساهيل", template("مرحباً بك في تساهيل",
                "تم إنشاء حساب " + escape(workshopName) + " بواسطة إدارة المنصة.",
                button(url, "إعداد كلمة المرور") + "<p style=\"color:#64748b\">الرابط صالح لمدة 24 ساعة ويستخدم مرة واحدة.</p>"));
    }

    public void sendWelcome(String email, String name) {
        sendHtml(email, "مرحباً بك في تساهيل", template("أهلاً " + escape(name),
                "اكتمل تفعيل حسابك ويمكنك الآن الاستفادة من خدمات منصة تساهيل.", ""));
    }

    public void sendEmailActivated(String email, String name) {
        sendHtml(email, "تم تفعيل البريد الإلكتروني - تساهيل", template("تم تفعيل حسابك",
                "مرحباً " + escape(name) + "، تم توثيق بريدك الإلكتروني بنجاح.", ""));
    }

    public void sendTechnicianInvitation(String email, String name, String token) {
        String url = workshopUrl + "/set-password?token=" + encodeToken(token);
        sendHtml(email, "دعوة فني إلى تساهيل", template("مرحباً " + escape(name),
                "أنشأت الورشة حساباً فنياً لك. استخدم الزر التالي لإعداد كلمة المرور.", button(url, "إعداد الحساب")));
    }

    public void sendSupportAgentInvitation(String email,String name,String token){
        String url=adminUrl+"/set-password?token="+encodeToken(token);
        sendHtml(email,"دعوة مشرف خدمة العملاء - تساهيل",template("مرحباً "+escape(name),"أنشأت إدارة تساهيل حساب مشرف خدمة العملاء الخاص بك.",button(url,"إعداد كلمة المرور")+"<p style=\"color:#64748b\">الرابط صالح لمدة 24 ساعة ويستخدم مرة واحدة.</p>"));
    }

    public void sendRequestCreated(String email, String name, String requestReference) {
        sendHtml(email, "تم إنشاء طلب الصيانة - تساهيل", template("تم استلام طلبك",
                "مرحباً " + escape(name) + "، تم إنشاء طلب الصيانة رقم " + escape(requestReference) + ".", ""));
    }

    public void sendRequestAccepted(String email, String name, String requestReference) {
        sendHtml(email, "تم قبول طلب الصيانة - تساهيل", template("تم قبول الطلب",
                "مرحباً " + escape(name) + "، تم قبول الطلب رقم " + escape(requestReference) + ".", ""));
    }

    public void sendInspectionReportReady(String email, String name, String requestReference) {
        sendHtml(email, "تقرير الفحص جاهز - تساهيل", template("تقرير الفحص متاح",
                "مرحباً " + escape(name) + "، أصبح تقرير فحص الطلب رقم " + escape(requestReference) + " متاحاً داخل التطبيق.", ""));
    }

    public void sendInvoiceIssued(String email, String name, String requestReference) {
        sendHtml(email, "تم إصدار الفاتورة - تساهيل", template("فاتورتك جاهزة",
                "مرحباً " + escape(name) + "، صدرت فاتورة الطلب رقم " + escape(requestReference) + " ويمكن مراجعتها داخل التطبيق.", ""));
    }

    public void sendRequestStatusChanged(String email, String name, String requestReference, String status) {
        sendHtml(email, "تحديث حالة الطلب - تساهيل", template("تحديث جديد",
                "مرحباً " + escape(name) + "، تغيرت حالة الطلب رقم " + escape(requestReference) + " إلى: " + escape(status) + ".", ""));
    }

    public void sendRequestCancelled(String email, String name, String requestReference) {
        sendHtml(email, "تم إلغاء الطلب - تساهيل", template("إلغاء طلب الصيانة",
                "مرحباً " + escape(name) + "، تم إلغاء الطلب رقم " + escape(requestReference) + ".", ""));
    }

    public void sendText(String to, String subject, String text) {
        sendHtml(to, subject, template(subject, escape(text).replace("\n", "<br>"), ""));
    }

    public void sendHtml(String to, String subject, String html) {
        validate(to, subject);
        if (!enabled) {
            log.warn("Email delivery is disabled; message was not sent (recipient={}, subject={})", mask(to), subject);
            return;
        }
        if (smtpUsername == null || smtpUsername.isBlank()) {
            throw new EmailDeliveryException("Email delivery is not configured");
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, UTF_8);
            helper.setFrom(new InternetAddress(fromEmail, fromName, UTF_8));
            helper.setTo(to.trim());
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("Email delivered via SMTP (recipient={}, subject={})", mask(to), subject);
        } catch (Exception ex) {
            log.error("SMTP email delivery failed (recipient={}, subject={}, error={})", mask(to), subject,
                    ex.getClass().getSimpleName());
            throw new EmailDeliveryException("Email delivery failed", ex);
        }
    }

    public boolean isConfigured() {
        return enabled && smtpUsername != null && !smtpUsername.isBlank();
    }

    String template(String title, String intro, String content) {
        return "<!doctype html><html lang=\"ar\" dir=\"rtl\"><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"></head>"
                + "<body style=\"margin:0;background:#f4f6f8;font-family:Tahoma,Arial,sans-serif;color:#111827\"><table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\"><tr><td style=\"padding:28px 12px\">"
                + "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:600px;margin:auto;background:#fff;border:1px solid #e5e7eb;border-radius:18px\"><tr><td style=\"padding:32px;text-align:right\">"
                + "<div style=\"font-size:26px;font-weight:800;color:#d90408;margin-bottom:24px\">تساهيل</div><h1 style=\"font-size:22px;margin:0 0 16px\">" + title + "</h1>"
                + "<p style=\"font-size:16px;line-height:1.8;color:#475569\">" + intro + "</p>" + content
                + "<hr style=\"border:0;border-top:1px solid #e5e7eb;margin:28px 0\"><p style=\"font-size:12px;color:#94a3b8;line-height:1.7\">هذه رسالة آلية من منصة تساهيل لصيانة السيارات، يرجى عدم الرد عليها.</p>"
                + "</td></tr></table></td></tr></table></body></html>";
    }

    private String button(String url, String label) {
        return "<p style=\"margin:24px 0\"><a href=\"" + escape(url) + "\" style=\"display:inline-block;background:#d90408;color:#fff;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:700\">" + label + "</a></p>";
    }

    private void validate(String to, String subject) {
        if (to == null || to.isBlank() || !to.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"))
            throw new IllegalArgumentException("A valid recipient email is required");
        if (subject == null || subject.isBlank()) throw new IllegalArgumentException("Email subject is required");
    }

    private String encodeToken(String token) { return java.net.URLEncoder.encode(token, StandardCharsets.UTF_8); }
    private String mask(String email) {
        if (email == null || !email.contains("@")) return "***";
        return email.substring(0, 1) + "***" + email.substring(email.indexOf('@'));
    }
    private String escape(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&#39;");
    }
}
