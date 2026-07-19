package com.tasaheel.service;

import com.tasaheel.dto.AuthResponse;
import com.tasaheel.entity.*;
import com.tasaheel.exception.BadRequestException;
import com.tasaheel.integration.GoogleTokenVerifier;
import com.tasaheel.repository.*;
import com.tasaheel.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class OAuthService {

    private final OAuthAccountRepository oauthAccountRepository;
    private final CustomerRepository customerRepository;
    private final WorkshopRepository workshopRepository;
    private final DriverRepository driverRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final GoogleTokenVerifier googleTokenVerifier;

    @Transactional
    public AuthResponse handleGoogleToken(String idToken, String email, String name, String sub) {
        return handleOAuth("google", sub, email, name);
    }

    @Transactional
    public AuthResponse handleAppleToken(String identityToken, String email, String name, String sub) {
        return handleOAuth("apple", sub, email, name);
    }

    private AuthResponse handleOAuth(String provider, String providerId, String email, String name) {
        OAuthAccount existing = oauthAccountRepository.findByProviderAndProviderId(provider, providerId).orElse(null);
        if (existing != null) {
            String role = existing.getUserType();
            Long userId = existing.getUserId();
            String token = jwtService.generateToken(userId, role);
            return buildAuthResponse(token, role, userId, existing.getName(), existing.getEmail(), true, true);
        }

        OAuthAccount emailMatch = email != null ? oauthAccountRepository.findByProviderAndEmail(provider, email).orElse(null) : null;
        if (emailMatch != null) {
            emailMatch.setProviderId(providerId);
            if (name != null) emailMatch.setName(name);
            oauthAccountRepository.save(emailMatch);
            String token = jwtService.generateToken(emailMatch.getUserId(), emailMatch.getUserType());
            return buildAuthResponse(token, emailMatch.getUserType(), emailMatch.getUserId(), emailMatch.getName(), emailMatch.getEmail(), true, true);
        }

        Workshop workshop = email != null ? workshopRepository.findByEmail(email).orElse(null) : null;
        if (workshop != null) {
            if (!Boolean.TRUE.equals(workshop.getIsActive()) || !Boolean.TRUE.equals(workshop.getIsApproved()))
                throw new BadRequestException("Workshop account is not active or approved");
            oauthAccountRepository.save(OAuthAccount.builder().provider(provider).providerId(providerId).userType("workshop").userId(workshop.getId()).email(email).name(workshop.getName()).build());
            String token = jwtService.generateToken(workshop.getId(), "workshop");
            return buildAuthResponse(token, "workshop", workshop.getId(), workshop.getName(), email, true, true);
        }

        Customer customer = email != null ? customerRepository.findByEmail(email).orElse(null) : null;
        if (customer != null) {
            oauthAccountRepository.save(OAuthAccount.builder().provider(provider).providerId(providerId).userType("customer").userId(customer.getId()).email(email).name(customer.getName()).build());
            String token = jwtService.generateToken(customer.getId(), "customer");
            return buildAuthResponse(token, "customer", customer.getId(), customer.getName(), email, true, true);
        }

        Customer newCustomer = Customer.builder()
                .name(name != null ? name : email.split("@")[0])
                .email(email)
                .password(passwordEncoder.encode(providerId + System.currentTimeMillis()))
                .isActive(true)
                .emailVerifiedAt(LocalDateTime.now())
                .build();
        customerRepository.save(newCustomer);

        oauthAccountRepository.save(OAuthAccount.builder().provider(provider).providerId(providerId).userType("customer").userId(newCustomer.getId()).email(email).name(newCustomer.getName()).build());
        String token = jwtService.generateToken(newCustomer.getId(), "customer");
        return buildAuthResponse(token, "customer", newCustomer.getId(), newCustomer.getName(), email, true, true);
    }

    private AuthResponse buildAuthResponse(String token, String role, Long userId, String name, String email, Boolean isActive, Boolean emailVerified) {
        return AuthResponse.builder().token(token).role(role).userId(userId).name(name).email(email).isActive(isActive).emailVerified(emailVerified).build();
    }
}
