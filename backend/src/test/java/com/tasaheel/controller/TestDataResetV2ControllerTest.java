package com.tasaheel.controller;

import com.tasaheel.entity.*;
import com.tasaheel.repository.*;
import com.tasaheel.service.TestDataResetService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class TestDataResetV2ControllerTest {

    @Autowired private TestDataResetService resetService;
    @Autowired private CustomerRepository customerRepository;
    @Autowired private WorkshopRepository workshopRepository;
    @Autowired private TestDataResetAuditLogRepository auditLogRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private static Long testCustomerId;
    private static Long testWorkshopId;

    @Test
    @Order(0)
    void seedTestData() {
        if (customerRepository.count() == 0) {
            Customer c = customerRepository.save(Customer.builder()
                .name("V2 Test Customer")
                .email("v2-test@test.com")
                .phone("0911111111")
                .password(passwordEncoder.encode("123456"))
                .isActive(true)
                .build());
            testCustomerId = c.getId();
        } else {
            testCustomerId = customerRepository.findAll().get(0).getId();
        }

        if (workshopRepository.count() == 0) {
            Workshop w = workshopRepository.save(Workshop.builder()
                .name("V2 Test Workshop")
                .email("v2-test-workshop@test.com")
                .phone("0922222222")
                .password(passwordEncoder.encode("123456"))
                .isActive(true)
                .isApproved(true)
                .address("Test Address")
                .city("الرياض")
                .build());
            testWorkshopId = w.getId();
        } else {
            testWorkshopId = workshopRepository.findAll().get(0).getId();
        }
    }

    @Test
    @Order(1)
    void resolveUsersReturnsNamesAndEmails() {
        Map<String, Object> result = resetService.resolveUsers();

        assertNotNull(result);
        assertTrue(result.containsKey("customers"));
        assertTrue(result.containsKey("workshops"));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> customers = (List<Map<String, Object>>) result.get("customers");
        assertFalse(customers.isEmpty(), "Should have at least one customer");

        Map<String, Object> firstCustomer = customers.get(0);
        assertTrue(firstCustomer.containsKey("id"));
        assertTrue(firstCustomer.containsKey("name"));
        assertTrue(firstCustomer.containsKey("email"));
        assertNotNull(firstCustomer.get("name"));
        assertNotNull(firstCustomer.get("email"));
    }

    @Test
    @Order(2)
    void resolveUsersWorkshopsHaveNamesAndEmails() {
        Map<String, Object> result = resetService.resolveUsers();

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> workshops = (List<Map<String, Object>>) result.get("workshops");
        assertFalse(workshops.isEmpty(), "Should have at least one workshop");

        Map<String, Object> firstWorkshop = workshops.get(0);
        assertTrue(firstWorkshop.containsKey("id"));
        assertTrue(firstWorkshop.containsKey("name"));
        assertTrue(firstWorkshop.containsKey("email"));
    }

    @Test
    @Order(3)
    void countOperationalDataWithCustomerAndWorkshop() {
        List<Long> customerIds = List.of(testCustomerId);
        List<Long> workshopIds = List.of(testWorkshopId);

        var counts = resetService.countOperationalData(customerIds, workshopIds);
        assertNotNull(counts);
        assertFalse(counts.isEmpty());

        boolean hasNonZero = counts.stream().anyMatch(c -> c.count() > 0);
        assertFalse(hasNonZero, "Fresh test data should have 0 operational records");
    }

    @Test
    @Order(4)
    void dryRunReturnsReport() {
        TestDataResetService.ResetReport report = resetService.execute(true, false);
        assertNotNull(report);
        assertTrue(report.dryRun());
        assertTrue(report.customerIds().contains(testCustomerId));
        assertTrue(report.workshopIds().contains(testWorkshopId));
    }

    @Test
    @Order(5)
    void getAuditLogsReturnsEmptyOrExisting() {
        List<TestDataResetAuditLog> logs = resetService.getAuditLogs();
        assertNotNull(logs);
    }

    @Test
    @Order(6)
    void confirmTextConstant() {
        assertEquals("RESET_TASAHEEL_TEST_DATA", TestDataResetService.CONFIRM_TEXT);
    }

    @Test
    @Order(7)
    void resetTableCountRecordHasTableNameAndCount() {
        var tc = new TestDataResetService.TableCount("test_table", 42);
        assertEquals("test_table", tc.tableName());
        assertEquals(42, tc.count());
    }
}
