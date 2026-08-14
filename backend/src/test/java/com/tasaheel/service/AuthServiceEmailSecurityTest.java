package com.tasaheel.service;

import com.tasaheel.entity.Customer;
import com.tasaheel.entity.Workshop;
import com.tasaheel.exception.BadRequestException;
import com.tasaheel.integration.EmailService;
import com.tasaheel.repository.*;
import com.tasaheel.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class AuthServiceEmailSecurityTest {
    private EmailService emailService;
    private CustomerRepository customers;
    private WorkshopRepository workshops;
    private AuthService service;

    @BeforeEach
    void setUp() {
        customers = mock(CustomerRepository.class);
        workshops = mock(WorkshopRepository.class);
        emailService = mock(EmailService.class);
        service = new AuthService(customers, workshops, mock(DriverRepository.class),
                mock(TechnicianRepository.class), mock(JwtService.class), new BCryptPasswordEncoder(),
                emailService, mock(RefreshTokenRepository.class), mock(AdminUserRepository.class));
        ReflectionTestUtils.setField(service, "workshopAppUrl", "https://workshop.example");
        ReflectionTestUtils.setField(service, "adminAppUrl", "https://admin.example");
    }

    @Test
    void doesNotGenerateOrLogOtpWhenMailIsUnavailable() {
        when(emailService.isConfigured()).thenReturn(false);
        assertThat(service.sendEmailVerification("User@Example.com")).isFalse();
        verify(emailService, never()).sendOtp(anyString(), anyString());
    }

    @Test
    void limitsVerificationRequestsPerHour() {
        when(emailService.isConfigured()).thenReturn(true);
        for (int i = 0; i < 5; i++) assertThat(service.sendEmailVerification("user@example.com")).isTrue();
        assertThatThrownBy(() -> service.sendEmailVerification("user@example.com"))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("Too many");
    }

    @Test
    void otpIsSingleUseAndActivatesMatchingAccount() {
        when(emailService.isConfigured()).thenReturn(true);
        ArgumentCaptor<String> code = ArgumentCaptor.forClass(String.class);
        service.sendEmailVerification("User@Example.com");
        verify(emailService).sendOtp(eq("user@example.com"), code.capture());

        Customer customer = Customer.builder().id(7L).email("user@example.com").isActive(false).build();
        when(customers.findByEmail("user@example.com")).thenReturn(Optional.of(customer));
        service.verifyEmail("user@example.com", code.getValue());
        assertThat(customer.getIsActive()).isTrue();
        assertThat(customer.getEmailVerifiedAt()).isBeforeOrEqualTo(LocalDateTime.now());
        verify(customers).save(customer);
        assertThatThrownBy(() -> service.verifyEmail("user@example.com", code.getValue()))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("Invalid or expired");
    }

    @Test
    void workshopEmailVerificationNeverActivatesOrApprovesWorkshop() {
        when(emailService.isConfigured()).thenReturn(true);
        ArgumentCaptor<String> code = ArgumentCaptor.forClass(String.class);
        service.sendEmailVerification("workshop@example.com");
        verify(emailService).sendOtp(eq("workshop@example.com"), code.capture());

        Workshop workshop = Workshop.builder()
                .id(11L).email("workshop@example.com").isActive(false).isApproved(false).build();
        when(workshops.findByEmail("workshop@example.com")).thenReturn(Optional.of(workshop));

        service.verifyEmail("workshop@example.com", code.getValue());

        assertThat(workshop.getEmailVerifiedAt()).isNotNull();
        assertThat(workshop.getIsActive()).isFalse();
        assertThat(workshop.getIsApproved()).isFalse();
        verify(workshops).save(workshop);
    }
}
