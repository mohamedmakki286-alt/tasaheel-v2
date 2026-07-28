package com.tasaheel.service;

import com.tasaheel.repository.*;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class AIAssistantContextServiceTest {
    private final AIAssistantContextService service = new AIAssistantContextService(
            mock(CustomerRepository.class),
            mock(CustomerCarRepository.class),
            mock(MaintenanceRequestRepository.class),
            mock(InvoiceRepository.class),
            mock(WorkshopRepository.class));

    @Test
    void visitorContextNeverContainsPersonalData() {
        String context = service.buildContext(null);

        assertThat(context).contains("زائر غير مسجل", "لا تعرض بيانات شخصية");
    }
}
