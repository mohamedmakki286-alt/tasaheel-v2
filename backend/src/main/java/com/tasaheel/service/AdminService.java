package com.tasaheel.service;

import com.tasaheel.dto.*;
import com.tasaheel.entity.*;
import com.tasaheel.event.EventPublisher;
import com.tasaheel.event.EventType;
import com.tasaheel.exception.BadRequestException;
import com.tasaheel.exception.ResourceNotFoundException;
import com.tasaheel.integration.MediaService;
import com.tasaheel.repository.*;
import com.tasaheel.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final CustomerRepository customerRepository;
    private final WorkshopRepository workshopRepository;
    private final DriverRepository driverRepository;
    private final TechnicianRepository technicianRepository;
    private final MaintenanceRequestRepository requestRepository;
    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final MediaService mediaService;
    private final PasswordEncoder passwordEncoder;
    private final RequestStatusHistoryRepository statusHistoryRepository;
    private final EventPublisher eventPublisher;

    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        LocalDateTime monthStart = LocalDateTime.now().minusDays(30);
        LocalDateTime yearStart = LocalDateTime.now().minusMonths(12);

        stats.put("totalCustomers", customerRepository.count());
        stats.put("totalWorkshops", workshopRepository.count());
        stats.put("totalDrivers", driverRepository.count());
        stats.put("totalRequests", requestRepository.count());
        stats.put("pendingRequests", requestRepository.countByStatus("pending"));
        stats.put("inProgressRequests", requestRepository.countByStatus("in_progress"));
        stats.put("completedRequests", requestRepository.countByStatus("completed"));
        stats.put("cancelledRequests", requestRepository.countByStatus("cancelled"));

        Double totalRevenue = invoiceRepository.sumByStatus("paid");
        stats.put("totalRevenue", totalRevenue != null ? totalRevenue : 0.0);
        Double revenueMonth = invoiceRepository.sumByStatusAndPaidAtAfter("paid", monthStart);
        stats.put("revenueThisMonth", revenueMonth != null ? revenueMonth : 0.0);

        stats.put("pendingPayments", paymentRepository.countByStatus("initiated"));
        stats.put("completedPayments", paymentRepository.countByStatus("completed"));
        stats.put("pendingPaymentsTotal", paymentRepository.sumByStatus("initiated"));
        stats.put("completedPaymentsTotal", paymentRepository.sumByStatus("completed"));
        stats.put("refundedPaymentsTotal", paymentRepository.sumByStatus("refunded"));

        // requestsByStatus: [{status, count}]
        List<Object[]> statusCounts = requestRepository.countByStatusGrouped();
        Map<String, Long> statusMap = new HashMap<>();
        for (Object[] row : statusCounts) {
            statusMap.put((String) row[0], (Long) row[1]);
        }
        List<Map<String, Object>> requestsByStatus = new ArrayList<>();
        for (String s : new String[]{"pending", "quoted", "customer_approved", "in_progress", "completed", "cancelled"}) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("status", s);
            entry.put("count", statusMap.getOrDefault(s, 0L));
            requestsByStatus.add(entry);
        }
        stats.put("requestsByStatus", requestsByStatus);

        // requestsPerDay: [{date, count}] for last 30 days
        List<Object[]> perDay = requestRepository.countRequestsPerDaySince(monthStart);
        List<Map<String, Object>> requestsPerDay = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE;
        for (Object[] row : perDay) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("date", row[0] != null ? row[0].toString() : "");
            entry.put("count", row[1] != null ? row[1] : 0);
            requestsPerDay.add(entry);
        }
        stats.put("requestsPerDay", requestsPerDay);

        // monthlyRevenue: [{month, revenue}] for last 12 months
        List<Object[]> revenueRows = invoiceRepository.revenuePerDaySince(yearStart);
        Map<String, Double> monthMap = new LinkedHashMap<>();
        for (Object[] row : revenueRows) {
            String day = row[0] != null ? row[0].toString() : "";
            if (day.length() >= 7) {
                String month = day.substring(0, 7);
                monthMap.merge(month, row[1] instanceof Number ? ((Number) row[1]).doubleValue() : 0.0, Double::sum);
            }
        }
        List<Map<String, Object>> monthlyRevenue = new ArrayList<>();
        for (Map.Entry<String, Double> e : monthMap.entrySet()) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("month", e.getKey());
            entry.put("revenue", e.getValue());
            monthlyRevenue.add(entry);
        }
        stats.put("monthlyRevenue", monthlyRevenue);

        // topWorkshops: [{id, name, requestsCount, revenue}]
        List<Object[]> workshopCounts = requestRepository.countRequestsByWorkshop();
        List<Map<String, Object>> topWorkshops = new ArrayList<>();
        for (Object[] row : workshopCounts) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("id", row[0] != null ? row[0] : 0);
            entry.put("name", row[1] != null ? row[1] : "");
            entry.put("requestsCount", row[2] != null ? row[2] : 0);
            entry.put("revenue", 0);
            topWorkshops.add(entry);
        }
        stats.put("topWorkshops", topWorkshops);

        // recentRequests
        List<MaintenanceRequest> recent = requestRepository.findTop10ByOrderByCreatedAtDesc();
        List<MaintenanceRequestDTO> recentDTOs = recent.stream().map(this::toMaintenanceRequestDTO).collect(Collectors.toList());
        stats.put("recentRequests", recentDTOs);

        return stats;
    }

    public Page<CustomerDTO> getCustomers(int page, int size, String search) {
        Page<Customer> customers;
        if (search != null && !search.isEmpty()) {
            customers = customerRepository.findByNameContainingOrPhoneContaining(search, search, PageRequest.of(page, size));
        } else {
            customers = customerRepository.findAll(PageRequest.of(page, size));
        }
        return customers.map(this::toCustomerDTO);
    }

    public CustomerDTO getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", id));
        return toCustomerDTO(customer);
    }

    public Page<WorkshopDTO> getWorkshops(int page, int size, String search, String status, String workshopType) {
        List<Workshop> filtered = workshopRepository.findAll().stream()
                .filter(w -> search == null || search.isBlank() || (w.getName() != null && w.getName().contains(search)) || (w.getCity() != null && w.getCity().contains(search)))
                .filter(w -> workshopType == null || workshopType.isBlank() || workshopType.equals(w.getWorkshopType()))
                .filter(w -> status == null || status.isBlank()
                        || ("approved".equals(status) && Boolean.TRUE.equals(w.getIsApproved()))
                        || ("pending".equals(status) && !Boolean.TRUE.equals(w.getIsApproved()) && (w.getRejectionReason() == null || w.getRejectionReason().isBlank()))
                        || ("rejected".equals(status) && w.getRejectionReason() != null && !w.getRejectionReason().isBlank()))
                .sorted(Comparator.comparing(Workshop::getId).reversed()).toList();
        int start = Math.min(page * size, filtered.size());
        int end = Math.min(start + size, filtered.size());
        List<WorkshopDTO> content = filtered.subList(start, end).stream().map(this::toWorkshopDTO).toList();
        return new PageImpl<>(content, PageRequest.of(page, size), filtered.size());
    }

    public Page<DriverDTO> getDrivers(int page, int size, String search) {
        Page<Driver> drivers;
        if (search != null && !search.isEmpty()) {
            drivers = driverRepository.findByNameContaining(search, PageRequest.of(page, size));
        } else {
            drivers = driverRepository.findAll(PageRequest.of(page, size));
        }
        return drivers.map(this::toDriverDTO);
    }

    public DriverDTO getDriverById(Long id) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", id));
        return toDriverDTO(driver);
    }

    public Page<TechnicianDTO> getTechnicians(int page, int size, Long workshopId) {
        Page<Technician> technicians;
        if (workshopId != null) {
            technicians = technicianRepository.findByWorkshopId(workshopId, PageRequest.of(page, size));
        } else {
            technicians = technicianRepository.findAll(PageRequest.of(page, size));
        }
        return technicians.map(this::toTechnicianDTO);
    }

    public WorkshopDTO getWorkshopById(Long id) {
        Workshop workshop = workshopRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workshop", id));
        return toWorkshopDTO(workshop);
    }

    @Transactional
    public WorkshopDTO createWorkshop(WorkshopDTO dto, MultipartFile commercialRegFile, MultipartFile municipalityFile, MultipartFile contractFile) {
        if (workshopRepository.existsByPhone(dto.getPhone())) {
            throw new BadRequestException("Phone number already registered");
        }
        if (dto.getEmail() != null && !dto.getEmail().isEmpty() && workshopRepository.existsByEmail(dto.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        String commercialRegUrl = null;
        String municipalityUrl = null;

        if (commercialRegFile != null && !commercialRegFile.isEmpty()) {
            commercialRegUrl = mediaService.storeFile(commercialRegFile, "commercial");
        }
        if (municipalityFile != null && !municipalityFile.isEmpty()) {
            municipalityUrl = mediaService.storeFile(municipalityFile, "municipality");
        }
        String contractUrl = contractFile != null && !contractFile.isEmpty()
                ? mediaService.storeFile(contractFile, "workshop-contract") : null;

        Workshop workshop = Workshop.builder()
                .name(dto.getName())
                .ownerName(dto.getOwnerName())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .password(passwordEncoder.encode(dto.getPassword() != null && !dto.getPassword().isBlank()
                        ? dto.getPassword() : java.util.UUID.randomUUID().toString()))
                .address(dto.getAddress())
                .city(dto.getCity())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .workshopType(dto.getWorkshopType() != null ? dto.getWorkshopType() : "stationary")
                .commercialRegistration(commercialRegUrl)
                .municipalityLicense(municipalityUrl)
                .beneficiaryName(dto.getBeneficiaryName()).bankName(dto.getBankName()).iban(dto.getIban())
                .taxNumber(dto.getTaxNumber()).commissionPercentage(dto.getCommissionPercentage())
                .adminNotes(dto.getAdminNotes()).contractUrl(contractUrl)
                .contractSignedAt(dto.getContractSignedAt()).contractExpiresAt(dto.getContractExpiresAt())
                .passwordSetupCompleted(dto.getPassword() != null && !dto.getPassword().isBlank())
                .isActive(Boolean.TRUE.equals(dto.getIsActive()))
                .isApproved(Boolean.TRUE.equals(dto.getIsApproved()))
                .build();

        workshop = workshopRepository.save(workshop);
        return toWorkshopDTO(workshop);
    }

    @Transactional
    public WorkshopDTO updateWorkshopAdmin(Long workshopId, WorkshopDTO dto, MultipartFile contractFile) {
        Workshop w = workshopRepository.findById(workshopId)
                .orElseThrow(() -> new ResourceNotFoundException("Workshop", workshopId));
        if (dto.getName() != null) w.setName(dto.getName());
        if (dto.getOwnerName() != null) w.setOwnerName(dto.getOwnerName());
        if (dto.getPhone() != null) w.setPhone(dto.getPhone());
        if (dto.getEmail() != null) w.setEmail(dto.getEmail());
        if (dto.getCity() != null) w.setCity(dto.getCity());
        if (dto.getAddress() != null) w.setAddress(dto.getAddress());
        if (dto.getWorkshopType() != null) w.setWorkshopType(dto.getWorkshopType());
        w.setWhatsapp(dto.getWhatsapp());
        w.setBeneficiaryName(dto.getBeneficiaryName());
        w.setBankName(dto.getBankName());
        w.setIban(dto.getIban());
        w.setTaxNumber(dto.getTaxNumber());
        w.setCommissionPercentage(dto.getCommissionPercentage());
        w.setAdminNotes(dto.getAdminNotes());
        w.setContractSignedAt(dto.getContractSignedAt());
        w.setContractExpiresAt(dto.getContractExpiresAt());
        if (contractFile != null && !contractFile.isEmpty()) {
            if (!"application/pdf".equalsIgnoreCase(contractFile.getContentType()))
                throw new BadRequestException("Contract must be a PDF file");
            w.setContractUrl(mediaService.storeFile(contractFile, "workshop-contract"));
        }
        return toWorkshopDTO(workshopRepository.save(w));
    }

    @Transactional
    public void approveWorkshop(Long workshopId) {
        Workshop workshop = workshopRepository.findById(workshopId)
                .orElseThrow(() -> new ResourceNotFoundException("Workshop", workshopId));
        workshop.setIsApproved(true);
        workshop.setRejectionReason(null);
        workshopRepository.save(workshop);
    }

    @Transactional
    public void rejectWorkshop(Long workshopId, String reason) {
        Workshop workshop = workshopRepository.findById(workshopId)
                .orElseThrow(() -> new ResourceNotFoundException("Workshop", workshopId));
        workshop.setIsApproved(false);
        workshop.setRejectionReason(reason);
        workshopRepository.save(workshop);
    }

    @Transactional
    public DriverDTO createDriver(DriverDTO dto) {
        if (driverRepository.existsByPhone(dto.getPhone())) {
            throw new BadRequestException("Phone number already registered");
        }
        if (dto.getEmail() != null && !dto.getEmail().isEmpty() && driverRepository.existsByEmail(dto.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        Driver driver = Driver.builder()
                .name(dto.getName())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .password(passwordEncoder.encode(dto.getPassword()))
                .city(dto.getCity())
                .vehicleType(dto.getVehicleType())
                .serviceMode(dto.getServiceMode() != null ? dto.getServiceMode() : "tow_truck")
                .plateNumber(dto.getPlateNumber())
                .isActive(true)
                .isApproved(true)
                .isOnline(false)
                .build();

        driver = driverRepository.save(driver);
        return toDriverDTO(driver);
    }

    @Transactional
    public void approveDriver(Long driverId) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", driverId));
        driver.setIsApproved(true);
        driverRepository.save(driver);
    }

    @Transactional
    public void toggleUserStatus(String userType, Long userId, boolean isActive) {
        switch (userType.toLowerCase()) {
            case "customer" -> {
                Customer customer = customerRepository.findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("Customer", userId));
                customer.setIsActive(isActive);
                customerRepository.save(customer);
            }
            case "workshop" -> {
                Workshop workshop = workshopRepository.findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("Workshop", userId));
                workshop.setIsActive(isActive);
                workshopRepository.save(workshop);
            }
            case "driver" -> {
                Driver driver = driverRepository.findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("Driver", userId));
                driver.setIsActive(isActive);
                driverRepository.save(driver);
            }
            case "technician" -> {
                Technician technician = technicianRepository.findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("Technician", userId));
                technician.setIsActive(isActive);
                technicianRepository.save(technician);
            }
            default -> throw new IllegalArgumentException("Invalid user type: " + userType);
        }
    }

    @Transactional
    public void deleteUser(String userType, Long userId) {
        switch (userType.toLowerCase()) {
            case "customer" -> {
                Customer customer = customerRepository.findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("Customer", userId));
                customer.setIsActive(false);
                customerRepository.save(customer);
            }
            case "workshop" -> {
                Workshop workshop = workshopRepository.findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("Workshop", userId));
                workshop.setIsActive(false);
                workshopRepository.save(workshop);
            }
            case "driver" -> {
                Driver driver = driverRepository.findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("Driver", userId));
                driver.setIsActive(false);
                driverRepository.save(driver);
            }
            case "technician" -> {
                Technician technician = technicianRepository.findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("Technician", userId));
                technician.setIsActive(false);
                technicianRepository.save(technician);
            }
            default -> throw new IllegalArgumentException("Invalid user type: " + userType);
        }
    }

    public Page<MaintenanceRequestDTO> getAllRequests(int page, int size, String search, String status) {
        Page<MaintenanceRequest> requests;
        if (status != null && !status.isEmpty()) {
            requests = requestRepository.findByStatus(status, PageRequest.of(page, size, Sort.by("createdAt").descending()));
        } else {
            requests = requestRepository.findAll(PageRequest.of(page, size, Sort.by("createdAt").descending()));
        }
        return requests.map(this::toMaintenanceRequestDTO);
    }

    @Transactional
    public void deleteRequest(Long id) {
        MaintenanceRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Request", id));
        request.setStatus("cancelled");
        requestRepository.save(request);
    }

    public Page<PaymentDTO> getAllPayments(int page, int size, String search, String status) {
        Page<com.tasaheel.entity.Payment> payments;
        if (status != null && !status.isEmpty()) {
            payments = paymentRepository.findByStatus(status, PageRequest.of(page, size, Sort.by("createdAt").descending()));
        } else {
            payments = paymentRepository.findAll(PageRequest.of(page, size, Sort.by("createdAt").descending()));
        }
        return payments.map(this::toPaymentDTO);
    }

    private MaintenanceRequestDTO toMaintenanceRequestDTO(MaintenanceRequest r) {
        List<ServiceType> sts = r.getServiceTypes();
        ServiceType primary = sts.isEmpty() ? null : sts.get(0);
        return MaintenanceRequestDTO.builder()
                .id(r.getId())
                .customerId(r.getCustomer().getId())
                .customerName(r.getCustomer().getName())
                .customerPhone(r.getCustomer().getPhone())
                .carId(r.getCar().getId())
                .carMake(r.getCar().getMake())
                .carModel(r.getCar().getModel())
                .carYear(r.getCar().getYear())
                .carPlateNumber(r.getCar().getPlateNumber())
                .serviceTypeId(primary != null ? primary.getId() : null)
                .serviceTypeName(primary != null ? primary.getName() : null)
                .serviceTypeIds(sts.stream().map(ServiceType::getId).collect(Collectors.toList()))
                .serviceTypes(sts.stream().map(s -> new ServiceItemDTO(s.getId(), s.getName())).collect(Collectors.toList()))
                .description(r.getDescription())
                .locationLat(r.getLocationLat())
                .locationLng(r.getLocationLng())
                .locationAddress(r.getLocationAddress())
                .city(r.getCity())
                .status(r.getStatus())
                .hasTransportRequest(r.getHasTransportRequest())
                .allowMultiWorkshop(r.getAllowMultiWorkshop())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }

    private PaymentDTO toPaymentDTO(com.tasaheel.entity.Payment payment) {
        return PaymentDTO.builder()
                .id(payment.getId())
                .requestId(payment.getRequest().getId())
                .customerId(payment.getCustomer().getId())
                .customerName(payment.getCustomer().getName())
                .amount(payment.getAmount())
                .fee(payment.getFee())
                .total(payment.getTotal())
                .currency(payment.getCurrency())
                .method(payment.getMethod())
                .status(payment.getStatus())
                .moyasarPaymentId(payment.getMoyasarPaymentId())
                .moyasarInvoiceId(payment.getMoyasarInvoiceId())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }

    private CustomerDTO toCustomerDTO(Customer c) {
        return CustomerDTO.builder()
                .id(c.getId())
                .name(c.getName())
                .phone(c.getPhone())
                .email(c.getEmail())
                .city(c.getCity())
                .avatar(c.getAvatar())
                .isActive(c.getIsActive())
                .fcmToken(c.getFcmToken())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private WorkshopDTO toWorkshopDTO(Workshop w) {
        return WorkshopDTO.builder()
                .id(w.getId())
                .name(w.getName())
                .ownerName(w.getOwnerName())
                .phone(w.getPhone())
                .email(w.getEmail())
                .address(w.getAddress())
                .city(w.getCity())
                .latitude(w.getLatitude())
                .longitude(w.getLongitude())
                .services(w.getServices())
                .commercialRegistration(w.getCommercialRegistration())
                .municipalityLicense(w.getMunicipalityLicense())
                .rejectionReason(w.getRejectionReason())
                .rating(w.getRating())
                .workshopType(w.getWorkshopType())
                .isActive(w.getIsActive())
                .isApproved(w.getIsApproved())
                .fcmToken(w.getFcmToken())
                .whatsapp(w.getWhatsapp())
                .beneficiaryName(w.getBeneficiaryName()).bankName(w.getBankName()).iban(w.getIban())
                .maskedIban(maskIban(w.getIban())).taxNumber(w.getTaxNumber())
                .commissionPercentage(w.getCommissionPercentage()).adminNotes(w.getAdminNotes())
                .contractUrl(w.getContractUrl()).contractSignedAt(w.getContractSignedAt())
                .contractExpiresAt(w.getContractExpiresAt()).passwordSetupCompleted(w.getPasswordSetupCompleted())
                .lastInvitationSentAt(w.getLastInvitationSentAt())
                .createdAt(w.getCreatedAt())
                .updatedAt(w.getUpdatedAt())
                .build();
    }

    private String maskIban(String iban) {
        if (iban == null || iban.length() < 8) return iban;
        return iban.substring(0, 2) + "••••••" + iban.substring(iban.length() - 4);
    }

    @Transactional
    public void overrideRequestStatus(Long requestId, String newStatus, Long adminId) {
        MaintenanceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request", requestId));

        String oldStatus = request.getStatus();
        request.setStatus(newStatus);
        requestRepository.save(request);

        RequestStatusHistory history = RequestStatusHistory.builder()
                .request(request)
                .status(newStatus)
                .notes("Admin override: " + oldStatus + " -> " + newStatus)
                .createdBy("admin:" + adminId)
                .build();
        statusHistoryRepository.save(history);

        eventPublisher.publish(this, EventType.ADMIN_OVERRIDE, requestId, "admin", adminId,
                Map.of("oldStatus", oldStatus, "newStatus", newStatus));
    }

    private DriverDTO toDriverDTO(Driver d) {
        return DriverDTO.builder()
                .id(d.getId())
                .name(d.getName())
                .phone(d.getPhone())
                .email(d.getEmail())
                .city(d.getCity())
                .vehicleType(d.getVehicleType())
                .serviceMode(d.getServiceMode())
                .plateNumber(d.getPlateNumber())
                .isActive(d.getIsActive())
                .isApproved(d.getIsApproved())
                .latitude(d.getLatitude())
                .longitude(d.getLongitude())
                .isOnline(d.getIsOnline())
                .fcmToken(d.getFcmToken())
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .build();
    }

    private TechnicianDTO toTechnicianDTO(Technician t) {
        return TechnicianDTO.builder()
                .id(t.getId())
                .name(t.getName())
                .phone(t.getPhone())
                .email(t.getEmail())
                .specialty(t.getSpecialty())
                .workshopId(t.getWorkshop().getId())
                .workshopName(t.getWorkshop().getName())
                .isActive(t.getIsActive())
                .isOnline(t.getIsOnline())
                .latitude(t.getLatitude())
                .longitude(t.getLongitude())
                .fcmToken(t.getFcmToken())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }
}
