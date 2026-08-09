package com.tasaheel.service;

import com.tasaheel.entity.Customer;
import com.tasaheel.entity.Workshop;
import com.tasaheel.repository.*;
import com.tasaheel.security.UserDetailsImpl;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class AIAssistantContextServiceTest {
    private final CustomerRepository customerRepository = mock(CustomerRepository.class);
    private final CustomerCarRepository carRepository = mock(CustomerCarRepository.class);
    private final MaintenanceRequestRepository requestRepository = mock(MaintenanceRequestRepository.class);
    private final InvoiceRepository invoiceRepository = mock(InvoiceRepository.class);
    private final WorkshopRepository workshopRepository = mock(WorkshopRepository.class);
    private final AIAssistantContextService service = new AIAssistantContextService(
            customerRepository, carRepository, requestRepository, invoiceRepository, workshopRepository);

    @Test
    void visitorContextNeverContainsPersonalData() {
        String context = service.buildContext(null);

        assertThat(context).contains("زائر غير مسجل", "لا تعرض بيانات شخصية");
    }

    @Test
    void customerCityWithTrailingSpaceStillFindsActiveWorkshop() {
        Customer customer = Customer.builder().id(8L).name("أحمد محمد").city("خميس مشيط ").password("x").build();
        Workshop workshop = Workshop.builder().id(52L).name("ورشة الاتقان").city("خميس مشيط")
                .address("").phone("0500000000").password("x").isApproved(true).isActive(true).build();
        when(customerRepository.findById(8L)).thenReturn(Optional.of(customer));
        when(carRepository.findByCustomerId(8L)).thenReturn(List.of());
        when(requestRepository.findByCustomerIdOrderByCreatedAtDesc(8L)).thenReturn(List.of());
        when(invoiceRepository.findByCustomerId(8L, PageRequest.of(0, 3))).thenReturn(Page.empty());
        when(workshopRepository.findActiveApprovedByNormalizedCity("خميس مشيط ")).thenReturn(List.of(workshop));

        String context = service.buildContext(new UserDetailsImpl(8L, "customer"));

        assertThat(context).contains("ورشة الاتقان", "خميس مشيط");
        assertThat(context).doesNotContain("لا توجد نتائج حالياً");
        verify(workshopRepository).findActiveApprovedByNormalizedCity("خميس مشيط ");
    }
}
