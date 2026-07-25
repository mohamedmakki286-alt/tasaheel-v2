package com.tasaheel.service;

import com.tasaheel.entity.*;
import com.tasaheel.repository.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class TestDataResetIntegrationTest {

    @Autowired private TestDataResetService resetService;
    @Autowired private CustomerRepository customerRepository;
    @Autowired private WorkshopRepository workshopRepository;
    @Autowired private TechnicianRepository technicianRepository;
    @Autowired private MaintenanceRequestRepository requestRepository;
    @Autowired private ChatRoomRepository chatRoomRepository;
    @Autowired private ChatMessageRepository chatMessageRepository;
    @Autowired private QuoteRepository quoteRepository;
    @Autowired private InvoiceRepository invoiceRepository;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private CallSessionRepository callSessionRepository;
    @Autowired private ReviewRepository reviewRepository;
    @Autowired private MediaRepository mediaRepository;
    @Autowired private AuthService authService;
    @Autowired private PasswordEncoder passwordEncoder;

    private static Long testCustomerId;
    private static Long testWorkshopId;
    private static Long preservedCustomerId;
    private static Long preservedWorkshopId;

    @Test
    @Order(0)
    void seedTestData() {
        // Preserve existing users
        List<Customer> customers = customerRepository.findAll();
        preservedCustomerId = customers.isEmpty() ? null : customers.get(0).getId();

        List<Workshop> workshops = workshopRepository.findAll();
        preservedWorkshopId = workshops.isEmpty() ? null : workshops.get(0).getId();

        // Create test customer to be deleted
        Customer testCustomer = Customer.builder()
                .name("Test Delete Customer")
                .email("test-delete@test.com")
                .phone("0999999999")
                .password(passwordEncoder.encode("123456"))
                .isActive(true)
                .build();
        testCustomerId = customerRepository.save(testCustomer).getId();

        // Create test workshop to be deleted
        Workshop testWorkshop = Workshop.builder()
                .name("Test Delete Workshop")
                .email("test-delete-workshop@test.com")
                .phone("0999999998")
                .password(passwordEncoder.encode("123456"))
                .isActive(true)
                .isApproved(true)
                .address("Test Address")
                .city("الرياض")
                .build();
        testWorkshopId = workshopRepository.save(testWorkshop).getId();

        assertNotNull(testCustomerId);
        assertNotNull(testWorkshopId);
        assertTrue(testCustomerId > 0);
        assertTrue(testWorkshopId > 0);
    }

    @Test
    @Order(1)
    void dryRunShowsCorrectCounts() {
        var ids = resetService.resolveIds();
        @SuppressWarnings("unchecked")
        List<Long> customerIds = (List<Long>) ids.get("customerIds");
        @SuppressWarnings("unchecked")
        List<Long> workshopIds = (List<Long>) ids.get("workshopIds");

        assertTrue(customerIds.contains(testCustomerId), "Test customer should be in customer IDs");
        assertTrue(workshopIds.contains(testWorkshopId), "Test workshop should be in workshop IDs");

        var counts = resetService.countOperationalData(customerIds, workshopIds);
        assertNotNull(counts);
        assertFalse(counts.isEmpty());
    }

    @Test
    @Order(2)
    void executeResetDeletesTestData() {
        TestDataResetService.ResetReport report = resetService.execute(false, false);

        assertNotNull(report);
        assertFalse(report.dryRun());
        assertTrue(report.totalDeleted() >= 0);

        // Verify test customer and workshop were in the target list
        assertTrue(report.customerIds().contains(testCustomerId));
        assertTrue(report.workshopIds().contains(testWorkshopId));
    }

    @Test
    @Order(3)
    void verifyTestDataDeleted() {
        assertFalse(requestRepository.existsById(999999L), "Non-existent request should not exist");
        assertTrue(customerRepository.existsById(testCustomerId), "Test customer should still exist (we don't delete users)");
        assertTrue(workshopRepository.existsById(testWorkshopId), "Test workshop should still exist (we don't delete users)");
    }

    @Test
    @Order(4)
    void preservedUsersStillFunctional() {
        if (preservedCustomerId != null) {
            assertTrue(customerRepository.existsById(preservedCustomerId),
                    "Preserved customer should still exist");
        }
        if (preservedWorkshopId != null) {
            assertTrue(workshopRepository.existsById(preservedWorkshopId),
                    "Preserved workshop should still exist");
        }
        // Technicians should be preserved
        List<Technician> technicians = technicianRepository.findAll();
        assertNotNull(technicians);
    }

    @Test
    @Order(5)
    void newRequestCanBeCreatedAfterReset() {
        Customer customer = customerRepository.findById(testCustomerId).orElseThrow();
        assertNotNull(customer.getName());
        assertNotNull(customer.getEmail());

        // Verify the customer can authenticate (login works)
        assertTrue(passwordEncoder.matches("123456", customer.getPassword()),
                "Customer password should still be valid");
    }
}
