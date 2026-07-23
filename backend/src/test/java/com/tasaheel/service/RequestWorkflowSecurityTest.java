package com.tasaheel.service;

import com.tasaheel.entity.Customer;
import com.tasaheel.entity.InspectionReport;
import com.tasaheel.entity.Invoice;
import com.tasaheel.entity.MaintenanceRequest;
import com.tasaheel.entity.Quote;
import com.tasaheel.entity.Workshop;
import com.tasaheel.event.EventPublisher;
import com.tasaheel.exception.BadRequestException;
import com.tasaheel.integration.MediaService;
import com.tasaheel.integration.FirebaseService;
import com.tasaheel.integration.MoyasarService;
import com.tasaheel.integration.TamaraService;
import com.tasaheel.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RequestWorkflowSecurityTest {

    @Mock private WorkshopRepository workshopRepository;
    @Mock private MaintenanceRequestRepository requestRepository;
    @Mock private QuoteRepository quoteRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private CustomerCarRepository customerCarRepository;
    @Mock private ServiceTypeRepository serviceTypeRepository;
    @Mock private WorkshopServiceRepository workshopServiceRepository;
    @Mock private ReviewRepository reviewRepository;
    @Mock private WorkshopGalleryRepository galleryRepository;
    @Mock private RequestStatusHistoryRepository statusHistoryRepository;
    @Mock private EventPublisher eventPublisher;

    @Mock private TechnicianRepository technicianRepository;
    @Mock private HomeServiceAssignmentRepository assignmentRepository;
    @Mock private ChatRoomRepository chatRoomRepository;
    @Mock private MediaRepository mediaRepository;
    @Mock private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Mock private InvoiceRepository invoiceRepository;
    @Mock private InspectionReportRepository inspectionReportRepository;
    @Mock private InvoiceItemRepository invoiceItemRepository;
    @Mock private WorkshopSettlementRepository settlementRepository;
    @Mock private RequestCompletionService requestCompletionService;

    @Mock private InspectionPartItemRepository inspectionPartItemRepository;
    @Mock private InspectionLaborItemRepository inspectionLaborItemRepository;
    @Mock private InspectionChecklistItemRepository inspectionChecklistItemRepository;

    @Mock private PaymentRepository paymentRepository;
    @Mock private MoyasarService moyasarService;
    @Mock private TamaraService tamaraService;
    @Mock private PlatformSettingService platformSettingService;
    @Mock private RequestWorkshopDispatchRepository dispatchRepository;
    @Mock private NotificationService notificationService;
    @Mock private FirebaseService firebaseService;

    @InjectMocks private WorkshopService workshopService;
    @InjectMocks private TechnicianService technicianService;
    @InjectMocks private InvoiceService invoiceService;
    @InjectMocks private InspectionReportService inspectionReportService;
    @InjectMocks private PaymentService paymentService;
    @InjectMocks private RequestDispatchService requestDispatchService;

    @BeforeEach
    void configureDispatch() {
        ReflectionTestUtils.setField(requestDispatchService, "maxWorkshops", 10);
        ReflectionTestUtils.setField(requestDispatchService, "expiryHours", 24L);
    }

    @Test
    void rejectedWorkshopCannotUpdateRequestStatus() {
        MaintenanceRequest request = MaintenanceRequest.builder().id(10L).status("customer_approved").build();
        Workshop selectedWorkshop = Workshop.builder().id(2L).build();
        Quote acceptedQuote = Quote.builder().request(request).workshop(selectedWorkshop).status("accepted").build();
        when(requestRepository.findById(10L)).thenReturn(Optional.of(request));
        when(quoteRepository.findByRequestIdAndStatus(10L, "accepted")).thenReturn(Optional.of(acceptedQuote));

        assertThrows(BadRequestException.class,
                () -> workshopService.updateRequestStatus(10L, 1L, "in_progress"));
    }

    @Test
    void nonSelectedWorkshopCannotAssignTechnician() {
        MaintenanceRequest request = MaintenanceRequest.builder().id(11L).status("accepted").build();
        Workshop selectedWorkshop = Workshop.builder().id(2L).build();
        Quote acceptedQuote = Quote.builder().request(request).workshop(selectedWorkshop).status("accepted").build();
        when(requestRepository.findById(11L)).thenReturn(Optional.of(request));
        when(quoteRepository.findByRequestIdAndStatus(11L, "accepted")).thenReturn(Optional.of(acceptedQuote));

        assertThrows(BadRequestException.class,
                () -> technicianService.assignTechnicianToRequest(11L, 1L, 8L));
        verifyNoInteractions(technicianRepository);
    }

    @Test
    void invoiceCannotBeCreatedBeforeWorkCompletion() {
        Customer customer = Customer.builder().id(3L).build();
        MaintenanceRequest request = MaintenanceRequest.builder()
                .id(12L).customer(customer).status("customer_approved").build();
        Workshop selectedWorkshop = Workshop.builder().id(4L).build();
        Quote acceptedQuote = Quote.builder().request(request).workshop(selectedWorkshop).status("accepted").build();
        when(requestRepository.findById(12L)).thenReturn(Optional.of(request));
        when(workshopRepository.findById(4L)).thenReturn(Optional.of(selectedWorkshop));
        when(quoteRepository.findByRequestIdAndStatus(12L, "accepted")).thenReturn(Optional.of(acceptedQuote));

        assertThrows(BadRequestException.class, () -> invoiceService.createOrUpdateInvoice(
                12L, 4L, 0.0, 0.0, 0.0, 0.0, 15.0, 0.0, List.of()));
    }

    @Test
    void paymentCannotStartBeforeWorkCompletion() {
        Customer customer = Customer.builder().id(5L).build();
        MaintenanceRequest request = MaintenanceRequest.builder()
                .id(13L).customer(customer).status("customer_approved").build();
        Invoice invoice = Invoice.builder().request(request).customer(customer)
                .status("approved").grandTotal(115.0).build();
        when(requestRepository.findById(13L)).thenReturn(Optional.of(request));
        when(customerRepository.findById(5L)).thenReturn(Optional.of(customer));
        when(invoiceRepository.findByRequestId(13L)).thenReturn(Optional.of(invoice));

        assertThrows(BadRequestException.class,
                () -> paymentService.initiatePayment(13L, 5L, 115.0, "mada"));
        verifyNoInteractions(moyasarService);
    }

    @Test
    void anotherCustomerCannotRejectInspectionReport() {
        Customer owner = Customer.builder().id(6L).build();
        MaintenanceRequest request = MaintenanceRequest.builder().id(14L).customer(owner).build();
        InspectionReport report = InspectionReport.builder()
                .id(15L).request(request).status("pending_approval").build();
        when(inspectionReportRepository.findById(15L)).thenReturn(Optional.of(report));

        assertThrows(BadRequestException.class,
                () -> inspectionReportService.rejectReport(15L, 99L, "غير موافق"));
    }

    @Test
    void requestIsPersistentlyDispatchedToEligibleWorkshops() {
        Customer customer = Customer.builder().id(7L).build();
        MaintenanceRequest request = MaintenanceRequest.builder()
                .id(20L).customer(customer).city("الرياض").status("pending").build();
        Workshop first = Workshop.builder().id(21L).name("الأولى")
                .city("الرياض").isApproved(true).isActive(true).build();
        Workshop second = Workshop.builder().id(22L).name("الثانية")
                .city("الرياض").isApproved(true).isActive(true).build();
        when(workshopRepository.findByCityAndIsApprovedAndIsActive("الرياض", true, true))
                .thenReturn(List.of(first, second));
        when(dispatchRepository.existsByRequestIdAndWorkshopId(any(), any())).thenReturn(false);
        when(dispatchRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        requestDispatchService.dispatch(request);

        verify(dispatchRepository, times(2)).save(any());
        verify(notificationService, times(2)).save(
                any(), any(), any(), any(), any(), any(), any());
    }
}
