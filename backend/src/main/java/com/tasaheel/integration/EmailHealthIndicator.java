package com.tasaheel.integration;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

@Component("email")
@RequiredArgsConstructor
public class EmailHealthIndicator implements HealthIndicator {
    private final EmailService emailService;

    @Override
    public Health health() {
        if (emailService.isConfigured()) {
            return Health.up().withDetail("provider", "brevo-smtp").withDetail("delivery", "enabled").build();
        }
        return Health.unknown().withDetail("provider", "brevo-smtp").withDetail("delivery", "disabled-or-unconfigured").build();
    }
}
