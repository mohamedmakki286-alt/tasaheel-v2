package com.tasaheel.security;

import com.tasaheel.entity.Workshop;
import com.tasaheel.repository.TechnicianRepository;
import com.tasaheel.repository.WorkshopRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class JwtAuthFilterWorkshopFreezeTest {

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void rejectsExistingWorkshopTokenImmediatelyAfterFreeze() throws Exception {
        JwtService jwtService = mock(JwtService.class);
        WorkshopRepository workshops = mock(WorkshopRepository.class);
        JwtAuthFilter filter = new JwtAuthFilter(jwtService, mock(TechnicianRepository.class), workshops);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer valid-token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(jwtService.extractUserId("valid-token")).thenReturn(17L);
        when(jwtService.extractRole("valid-token")).thenReturn("workshop");
        when(jwtService.isTokenValid("valid-token")).thenReturn(true);
        when(workshops.findByIdAndIsDeletedFalse(17L)).thenReturn(Optional.of(
                Workshop.builder()
                        .id(17L)
                        .isApproved(true)
                        .isActive(false)
                        .passwordSetupCompleted(true)
                        .emailVerifiedAt(java.time.LocalDateTime.now())
                        .build()));

        filter.doFilter(request, response, (req, res) -> { });

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(workshops).findByIdAndIsDeletedFalse(17L);
    }
}
