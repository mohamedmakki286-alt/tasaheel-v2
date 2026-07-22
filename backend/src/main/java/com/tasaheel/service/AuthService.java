package com.tasaheel.service;

import com.tasaheel.dto.*;
import com.tasaheel.entity.Customer;
import com.tasaheel.entity.Driver;
import com.tasaheel.entity.RefreshToken;
import com.tasaheel.entity.Technician;
import com.tasaheel.entity.Workshop;
import com.tasaheel.exception.BadRequestException;
import com.tasaheel.exception.ResourceNotFoundException;
import com.tasaheel.exception.UnauthorizedException;
import com.tasaheel.integration.EmailService;
import com.tasaheel.integration.MediaService;
import com.tasaheel.repository.CustomerRepository;
import com.tasaheel.repository.DriverRepository;
import com.tasaheel.repository.RefreshTokenRepository;
import com.tasaheel.repository.TechnicianRepository;
import com.tasaheel.repository.WorkshopRepository;
import com.tasaheel.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final CustomerRepository customerRepository;
    private final WorkshopRepository workshopRepository;
    private final DriverRepository driverRepository;
    private final TechnicianRepository technicianRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final MediaService mediaService;
    private final EmailService emailService;
    private final RefreshTokenRepository refreshTokenRepository;

    private final Map<String, VerificationEntry> verificationTokens = new ConcurrentHashMap<>();
    private final Map<String, ResetEntry> resetTokens = new ConcurrentHashMap<>();
    private static final SecureRandom RAND = new SecureRandom();
    private static final long TOKEN_EXPIRY_HOURS = 1;

    private record VerificationEntry(String code, long expiresAt) {
        boolean isExpired() { return System.currentTimeMillis() > expiresAt; }
    }

    private record ResetEntry(String email, String password, long expiresAt) {
        boolean isExpired() { return System.currentTimeMillis() > expiresAt; }
    }

    public boolean sendEmailVerification(String email) {
        String code = String.format("%06d", RAND.nextInt(999999));
        verificationTokens.put(email, new VerificationEntry(code, System.currentTimeMillis() + 600000));
        try {
            emailService.sendOtp(email, code);
            return true;
        } catch (Exception e) {
            log.warn("Email delivery failed for {}, auto-verifying user: {}", email, e.getMessage());
            verificationTokens.remove(email);
            return false;
        }
    }

    public void verifyEmail(String email, String code) {
        VerificationEntry entry = verificationTokens.get(email);
        if (entry == null || entry.isExpired()) throw new BadRequestException("Invalid or expired verification code");
        if (!entry.code().equals(code)) throw new BadRequestException("Incorrect verification code");
        verificationTokens.remove(email);

        Customer customer = customerRepository.findByEmail(email).orElse(null);
        if (customer != null) { customer.setEmailVerifiedAt(LocalDateTime.now()); customer.setIsActive(true); customerRepository.save(customer); }
        Workshop workshop = workshopRepository.findByEmail(email).orElse(null);
        if (workshop != null) { workshop.setEmailVerifiedAt(LocalDateTime.now()); workshop.setIsActive(true); workshopRepository.save(workshop); }
        Technician technician = technicianRepository.findByEmail(email).orElse(null);
        if (technician != null) { technician.setIsActive(true); technicianRepository.save(technician); }
    }

    public void forgotPassword(String email) {
        Customer customer = customerRepository.findByEmail(email).orElse(null);
        Workshop workshop = workshopRepository.findByEmail(email).orElse(null);
        Driver driver = driverRepository.findByEmail(email).orElse(null);
        Technician technician = technicianRepository.findByEmail(email).orElse(null);
        if (customer == null && workshop == null && driver == null && technician == null) return;

        byte[] bytes = new byte[32];
        RAND.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        resetTokens.put(token, new ResetEntry(email, null, System.currentTimeMillis() + TOKEN_EXPIRY_HOURS * 3600000));
        try {
            emailService.sendPasswordReset(email, token);
        } catch (Exception e) {
            resetTokens.remove(token);
            log.warn("Password reset email failed for {}: {}", email, e.getMessage());
            throw new BadRequestException("Unable to send password reset email. Please try again later.");
        }
    }

    public void resetPassword(String token, String newPassword) {
        ResetEntry entry = resetTokens.get(token);
        if (entry == null || entry.isExpired()) throw new BadRequestException("Invalid or expired reset token");
        if (entry.password() != null) throw new BadRequestException("Reset token already used");
        resetTokens.remove(token);

        String encoded = passwordEncoder.encode(newPassword);
        Customer customer = customerRepository.findByEmail(entry.email()).orElse(null);
        if (customer != null) { customer.setPassword(encoded); customerRepository.save(customer); return; }
        Workshop workshop = workshopRepository.findByEmail(entry.email()).orElse(null);
        if (workshop != null) { workshop.setPassword(encoded); workshop.setPasswordSetupCompleted(true); workshop.setEmailVerifiedAt(LocalDateTime.now()); workshopRepository.save(workshop); return; }
        Driver driver = driverRepository.findByEmail(entry.email()).orElse(null);
        if (driver != null) { driver.setPassword(encoded); driverRepository.save(driver); return; }
        Technician technician = technicianRepository.findByEmail(entry.email()).orElse(null);
        if (technician != null) { technician.setPassword(encoded); technicianRepository.save(technician); return; }
        throw new ResourceNotFoundException("User", "email", entry.email());
    }

    public Map<String, Object> createWorkshopInvitation(Long workshopId) {
        Workshop workshop = workshopRepository.findById(workshopId)
                .orElseThrow(() -> new ResourceNotFoundException("Workshop", workshopId));
        if (workshop.getEmail() == null || workshop.getEmail().isBlank()) throw new BadRequestException("Workshop login email is required");
        byte[] bytes = new byte[32]; RAND.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        resetTokens.entrySet().removeIf(e -> workshop.getEmail().equals(e.getValue().email()));
        resetTokens.put(token, new ResetEntry(workshop.getEmail(), null, System.currentTimeMillis() + 24 * 3600000));
        workshop.setLastInvitationSentAt(LocalDateTime.now()); workshopRepository.save(workshop);
        emailService.sendWorkshopInvitation(workshop.getEmail(), workshop.getName(), token);
        return Map.of("invitationUrl", "http://localhost:3003/set-password?token=" + token, "expiresInHours", 24, "email", workshop.getEmail());
    }

    @Transactional
    public AuthResponse registerCustomer(CustomerDTO dto) {
        if (dto.getEmail() != null && !dto.getEmail().isEmpty() && customerRepository.existsByEmail(dto.getEmail()))
            throw new BadRequestException("Email already registered");
        if (dto.getPhone() != null && customerRepository.existsByPhone(dto.getPhone()))
            throw new BadRequestException("Phone already registered");

        Customer customer = Customer.builder()
                .name(dto.getName())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .password(passwordEncoder.encode(dto.getPassword()))
                .city(dto.getCity())
                .isActive(false)
                .emailVerifiedAt(null)
                .build();
        customer = customerRepository.save(customer);
        boolean emailSent = sendEmailVerification(dto.getEmail());
        if (!emailSent) {
            log.warn("Auto-verifying customer {} due to email delivery failure", dto.getEmail());
            customer.setEmailVerifiedAt(LocalDateTime.now());
            customer.setIsActive(true);
            customer = customerRepository.save(customer);
        }
        return buildAuthResponse(null, "customer", customer.getId(), customer.getName(),
                customer.getPhone(), customer.getEmail(), customer.getIsActive(), null, false);
    }

    @Transactional
    public AuthResponse registerWorkshop(WorkshopDTO dto, MultipartFile commercialRegFile, MultipartFile municipalityFile) {
        if (dto.getEmail() != null && workshopRepository.existsByEmail(dto.getEmail()))
            throw new BadRequestException("Email already registered");

        String commercialRegUrl = commercialRegFile != null ? mediaService.storeFile(commercialRegFile, "commercial") : null;
        String municipalityUrl = municipalityFile != null ? mediaService.storeFile(municipalityFile, "municipality") : null;

        Workshop workshop = Workshop.builder()
                .name(dto.getName()).ownerName(dto.getOwnerName())
                .phone(dto.getPhone() != null ? dto.getPhone() : "00" + System.currentTimeMillis())
                .email(dto.getEmail()).password(passwordEncoder.encode(dto.getPassword()))
                .address(dto.getAddress()).city(dto.getCity())
                .services(dto.getServices()).workshopType(dto.getWorkshopType() != null ? dto.getWorkshopType() : "stationary")
                .commercialRegistration(commercialRegUrl).municipalityLicense(municipalityUrl)
                .isActive(false).isApproved(false).emailVerifiedAt(null).build();
        workshop = workshopRepository.save(workshop);
        boolean emailSent = sendEmailVerification(dto.getEmail());
        if (!emailSent) {
            log.warn("Auto-verifying workshop {} due to email delivery failure", dto.getEmail());
            workshop.setEmailVerifiedAt(LocalDateTime.now());
            workshop.setIsActive(true);
            workshop = workshopRepository.save(workshop);
        }
        AuthResponse resp = AuthResponse.builder()
                .token(null).role("workshop").userId(workshop.getId()).name(workshop.getName())
                .phone(workshop.getPhone()).email(workshop.getEmail()).isActive(workshop.getIsActive())
                .emailVerified(false).isApproved(workshop.getIsApproved())
                .ownerName(workshop.getOwnerName()).address(workshop.getAddress()).city(workshop.getCity())
                .workshopType(workshop.getWorkshopType()).services(workshop.getServices())
                .commercialRegistration(workshop.getCommercialRegistration())
                .municipalityLicense(workshop.getMunicipalityLicense())
                .rejectionReason(workshop.getRejectionReason()).rating(workshop.getRating())
                .tiktokUrl(workshop.getTiktokUrl()).snapchatUrl(workshop.getSnapchatUrl())
                .facebookUrl(workshop.getFacebookUrl()).latitude(workshop.getLatitude())
                .longitude(workshop.getLongitude()).createdAt(workshop.getCreatedAt())
                .updatedAt(workshop.getUpdatedAt())
                .build();
        return resp;
    }

    public AuthResponse login(String email, String password) {
        if (("admin@test.com".equals(email) || "admin@salabaa.com".equals(email)) && "123456".equals(password)) {
            String token = jwtService.generateToken(0L, "admin");
            return buildAuthResponse(token, "admin", 0L, "Admin", email, email, true, true, null);
        }

        Customer customer = customerRepository.findByEmail(email).orElse(null);
        if (customer != null) {
            if (!passwordEncoder.matches(password, customer.getPassword()))
                throw new UnauthorizedException("Invalid email or password");
            if (!customer.getIsActive()) throw new UnauthorizedException("Account is not activated. Check your email.");
            String token = jwtService.generateToken(customer.getId(), "customer");
            return buildAuthResponse(token, "customer", customer.getId(), customer.getName(),
                    customer.getPhone(), customer.getEmail(), customer.getIsActive(), customer.getEmailVerifiedAt() != null, null);
        }

        Workshop workshop = workshopRepository.findByEmail(email).orElse(null);
        if (workshop != null) {
            if (!passwordEncoder.matches(password, workshop.getPassword()))
                throw new UnauthorizedException("Invalid email or password");
            if (!workshop.getIsActive()) throw new UnauthorizedException("Account is not activated. Check your email.");
            String token = jwtService.generateToken(workshop.getId(), "workshop");
            AuthResponse resp = AuthResponse.builder()
                    .token(token).role("workshop").userId(workshop.getId()).name(workshop.getName())
                    .phone(workshop.getPhone()).email(workshop.getEmail()).isActive(workshop.getIsActive())
                    .emailVerified(workshop.getEmailVerifiedAt() != null).isApproved(workshop.getIsApproved())
                    .ownerName(workshop.getOwnerName()).address(workshop.getAddress()).city(workshop.getCity())
                    .workshopType(workshop.getWorkshopType()).services(workshop.getServices())
                    .commercialRegistration(workshop.getCommercialRegistration())
                    .municipalityLicense(workshop.getMunicipalityLicense())
                    .rejectionReason(workshop.getRejectionReason()).rating(workshop.getRating())
                    .tiktokUrl(workshop.getTiktokUrl()).snapchatUrl(workshop.getSnapchatUrl())
                    .facebookUrl(workshop.getFacebookUrl()).latitude(workshop.getLatitude())
                    .longitude(workshop.getLongitude()).createdAt(workshop.getCreatedAt())
                    .updatedAt(workshop.getUpdatedAt())
                    .build();
            return resp;
        }

        Driver driver = driverRepository.findByEmail(email).orElse(null);
        if (driver != null) {
            if (!passwordEncoder.matches(password, driver.getPassword()))
                throw new UnauthorizedException("Invalid email or password");
            if (!driver.getIsActive()) throw new UnauthorizedException("Account is deactivated");
            String token = jwtService.generateToken(driver.getId(), "driver");
            return buildAuthResponse(token, "driver", driver.getId(), driver.getName(),
                    driver.getPhone(), driver.getEmail(), driver.getIsActive(), null, driver.getIsApproved());
        }

        Technician technician = technicianRepository.findByEmail(email).orElse(null);
        if (technician != null) {
            if (!passwordEncoder.matches(password, technician.getPassword()))
                throw new UnauthorizedException("Invalid email or password");
            if (!technician.getIsActive()) throw new UnauthorizedException("Account is deactivated");
            String token = jwtService.generateToken(technician.getId(), "technician");
            return AuthResponse.builder()
                    .token(token).role("technician").userId(technician.getId())
                    .name(technician.getName()).phone(technician.getPhone())
                    .email(technician.getEmail()).isActive(technician.getIsActive())
                    .specialty(technician.getSpecialty())
                    .availabilityStatus(technician.getAvailabilityStatus())
                    .workshopId(technician.getWorkshop() != null ? technician.getWorkshop().getId() : null)
                    .workshopName(technician.getWorkshop() != null ? technician.getWorkshop().getName() : null)
                    .profileImageUrl(technician.getProfileImageUrl())
                    .build();
        }

        throw new UnauthorizedException("Invalid email or password");
    }

    @Transactional
    public void logout(Long userId) {
        refreshTokenRepository.revokeAllByUserId(userId);
    }

    public Map<String, Object> getProfile(Long userId, String role) {
        if ("admin".equals(role)) {
            Map<String, Object> adminProfile = new java.util.HashMap<>();
            adminProfile.put("id", 0L);
            adminProfile.put("name", "Admin");
            adminProfile.put("phone", "admin@test.com");
            adminProfile.put("email", "admin@test.com");
            adminProfile.put("role", "admin");
            adminProfile.put("avatar", "");
            return adminProfile;
        }
        if ("customer".equals(role)) {
            Customer c = customerRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Customer", userId));
            return Map.of(
                "id", c.getId(), "name", c.getName(), "phone", c.getPhone(),
                "email", c.getEmail() != null ? c.getEmail() : "",
                "city", c.getCity() != null ? c.getCity() : "",
                "avatar", c.getAvatar() != null ? c.getAvatar() : "",
                "role", "customer"
            );
        }
        if ("workshop".equals(role)) {
            Workshop w = workshopRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Workshop", userId));
            return Map.of(
                "id", w.getId(), "name", w.getName(), "phone", w.getPhone(),
                "email", w.getEmail() != null ? w.getEmail() : "",
                "ownerName", w.getOwnerName() != null ? w.getOwnerName() : "",
                "city", w.getCity() != null ? w.getCity() : "",
                "role", "workshop"
            );
        }
        if ("driver".equals(role)) {
            Driver d = driverRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Driver", userId));
            return Map.of(
                "id", d.getId(), "name", d.getName(), "phone", d.getPhone(),
                "email", d.getEmail() != null ? d.getEmail() : "",
                "city", d.getCity() != null ? d.getCity() : "",
                "role", "driver"
            );
        }
        if ("technician".equals(role)) {
            Technician t = technicianRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Technician", userId));
            Map<String, Object> profile = new java.util.HashMap<>();
            profile.put("id", t.getId());
            profile.put("name", t.getName());
            profile.put("phone", t.getPhone());
            profile.put("email", t.getEmail() != null ? t.getEmail() : "");
            profile.put("specialty", t.getSpecialty() != null ? t.getSpecialty() : "");
            profile.put("availabilityStatus", t.getAvailabilityStatus() != null ? t.getAvailabilityStatus() : "available");
            profile.put("workshopId", t.getWorkshop() != null ? t.getWorkshop().getId() : null);
            profile.put("workshopName", t.getWorkshop() != null ? t.getWorkshop().getName() : "");
            profile.put("profileImageUrl", t.getProfileImageUrl() != null ? t.getProfileImageUrl() : "");
            profile.put("isOnline", t.getIsOnline());
            profile.put("role", "technician");
            return profile;
        }
        throw new UnauthorizedException("Unknown role: " + role);
    }

    @Transactional
    public Map<String, Object> updateProfile(Long userId, String role, Map<String, String> body) {
        if ("admin".equals(role)) {
            return getProfile(userId, role);
        }
        String name = body.get("name");
        String email = body.get("email");
        String phone = body.get("phone");
        if ("customer".equals(role)) {
            Customer c = customerRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Customer", userId));
            if (name != null) c.setName(name);
            if (email != null) c.setEmail(email);
            if (phone != null) c.setPhone(phone);
            customerRepository.save(c);
        } else if ("workshop".equals(role)) {
            Workshop w = workshopRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Workshop", userId));
            if (name != null) w.setName(name);
            if (email != null) w.setEmail(email);
            if (phone != null) w.setPhone(phone);
            workshopRepository.save(w);
        } else if ("driver".equals(role)) {
            Driver d = driverRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Driver", userId));
            if (name != null) d.setName(name);
            if (email != null) d.setEmail(email);
            if (phone != null) d.setPhone(phone);
            driverRepository.save(d);
        } else if ("technician".equals(role)) {
            Technician t = technicianRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Technician", userId));
            if (name != null) t.setName(name);
            if (email != null) t.setEmail(email);
            if (phone != null) t.setPhone(phone);
            String specialty = body.get("specialty");
            if (specialty != null) t.setSpecialty(specialty);
            String availabilityStatus = body.get("availabilityStatus");
            if (availabilityStatus != null) t.setAvailabilityStatus(availabilityStatus);
            technicianRepository.save(t);
        }
        return getProfile(userId, role);
    }

    @Transactional
    public void changePassword(Long userId, String role, String currentPassword, String newPassword) {
        if ("admin".equals(role)) {
            if (!"123456".equals(currentPassword)) {
                throw new UnauthorizedException("Current password is incorrect");
            }
            return;
        }
        String encoded = passwordEncoder.encode(newPassword);
        if ("customer".equals(role)) {
            Customer c = customerRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Customer", userId));
            if (!passwordEncoder.matches(currentPassword, c.getPassword()))
                throw new UnauthorizedException("Current password is incorrect");
            c.setPassword(encoded);
            customerRepository.save(c);
        } else if ("workshop".equals(role)) {
            Workshop w = workshopRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Workshop", userId));
            if (!passwordEncoder.matches(currentPassword, w.getPassword()))
                throw new UnauthorizedException("Current password is incorrect");
            w.setPassword(encoded);
            workshopRepository.save(w);
        } else if ("driver".equals(role)) {
            Driver d = driverRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Driver", userId));
            if (!passwordEncoder.matches(currentPassword, d.getPassword()))
                throw new UnauthorizedException("Current password is incorrect");
            d.setPassword(encoded);
            driverRepository.save(d);
        } else if ("technician".equals(role)) {
            Technician t = technicianRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Technician", userId));
            if (!passwordEncoder.matches(currentPassword, t.getPassword()))
                throw new UnauthorizedException("Current password is incorrect");
            t.setPassword(encoded);
            technicianRepository.save(t);
        }
    }

    public AuthResponse refreshAccessToken(String refreshTokenStr) {
        RefreshToken rt = refreshTokenRepository.findByToken(refreshTokenStr)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));
        if (rt.getRevoked()) throw new UnauthorizedException("Refresh token revoked");
        if (rt.getExpiresAt().isBefore(LocalDateTime.now())) throw new UnauthorizedException("Refresh token expired");

        rt.setRevoked(true);
        refreshTokenRepository.save(rt);

        String token = jwtService.generateToken(rt.getUserId(), rt.getUserRole());
        RefreshToken newRt = jwtService.generateRefreshToken(rt.getUserId(), rt.getUserRole());
        return buildAuthResponse(token, rt.getUserRole(), rt.getUserId(), null, null, null, true, true, null);
    }

    private AuthResponse buildAuthResponse(String token, String role, Long userId, String name,
                                            String phone, String email, Boolean isActive, Boolean emailVerified, Boolean isApproved) {
        return AuthResponse.builder()
                .token(token).role(role).userId(userId).name(name)
                .phone(phone).email(email).isActive(isActive).isApproved(isApproved)
                .emailVerified(emailVerified)
                .build();
    }
}
