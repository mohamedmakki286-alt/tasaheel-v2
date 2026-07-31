package com.tasaheel.integration;

import com.tasaheel.exception.EmailDeliveryException;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Properties;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class EmailServiceTest {
    private JavaMailSender sender;
    private EmailService service;

    @BeforeEach
    void setUp() {
        sender = mock(JavaMailSender.class);
        service = new EmailService(sender);
        ReflectionTestUtils.setField(service, "enabled", true);
        ReflectionTestUtils.setField(service, "fromEmail", "noreply@salabaa.com");
        ReflectionTestUtils.setField(service, "fromName", "تساهيل");
        ReflectionTestUtils.setField(service, "smtpUsername", "brevo-user");
        ReflectionTestUtils.setField(service, "customerUrl", "https://customer.example");
        ReflectionTestUtils.setField(service, "workshopUrl", "https://workshop.example");
        when(sender.createMimeMessage()).thenAnswer(i -> new MimeMessage(Session.getInstance(new Properties())));
    }

    @Test
    void sendsUtf8HtmlWithConfiguredSender() throws Exception {
        service.sendOtp("user@example.com", "123456");
        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(sender).send(captor.capture());
        MimeMessage message = captor.getValue();
        assertThat(message.getFrom()[0].toString()).contains("noreply@salabaa.com");
        assertThat(message.getSubject()).contains("رمز التحقق");
        ByteArrayOutputStream raw = new ByteArrayOutputStream();
        message.writeTo(raw);
        assertThat(raw.toString(StandardCharsets.UTF_8)).contains("123456").containsIgnoringCase("text/html");
    }

    @Test
    void buildsResponsiveArabicTemplate() {
        String html = service.template("عنوان", "مقدمة", "محتوى");
        assertThat(html).contains("lang=\"ar\"").contains("dir=\"rtl\"")
                .contains("viewport").contains("تساهيل").contains("هذه رسالة آلية");
    }

    @Test
    void doesNotSendWhenDisabled() {
        ReflectionTestUtils.setField(service, "enabled", false);
        service.sendOtp("user@example.com", "123456");
        verifyNoInteractions(sender);
    }

    @Test
    void rejectsInvalidRecipient() {
        assertThatThrownBy(() -> service.sendText("not-email", "Subject", "Body"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void convertsSmtpFailureToSafeException() {
        doThrow(new MailSendException("authentication secret detail")).when(sender).send(any(MimeMessage.class));
        assertThatThrownBy(() -> service.sendOtp("user@example.com", "123456"))
                .isInstanceOf(EmailDeliveryException.class)
                .hasMessage("Email delivery failed")
                .hasMessageNotContaining("secret");
    }
}
