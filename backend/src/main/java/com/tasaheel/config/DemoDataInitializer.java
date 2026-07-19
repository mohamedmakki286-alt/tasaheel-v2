package com.tasaheel.config;

import com.tasaheel.entity.*;
import com.tasaheel.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DemoDataInitializer {

    private final MaintenanceRequestRepository requestRepository;
    private final CustomerRepository customerRepository;
    private final CustomerCarRepository customerCarRepository;
    private final WorkshopRepository workshopRepository;
    private final ServiceTypeRepository serviceTypeRepository;
    private final QuoteRepository quoteRepository;
    private final InspectionReportRepository inspectionReportRepository;
    private final InspectionPartItemRepository inspectionPartItemRepository;
    private final InspectionLaborItemRepository inspectionLaborItemRepository;
    private final InspectionChecklistItemRepository inspectionChecklistItemRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final PaymentRepository paymentRepository;
    private final ReviewRepository reviewRepository;
    private final RequestStatusHistoryRepository statusHistoryRepository;
    private final TechnicianRepository technicianRepository;
    private final DriverRepository driverRepository;
    private final TransportRequestRepository transportRequestRepository;
    private final HomeServiceAssignmentRepository homeServiceAssignmentRepository;
    private final ServiceItemRepository serviceItemRepository;
    private final AccountRepository accountRepository;
    private final PlatformSettingRepository platformSettingRepository;
    private final PasswordEncoder passwordEncoder;

    private List<ServiceType> allServiceTypes;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void init() {
        if (requestRepository.count() > 0) {
            log.info("Demo data already exists, skipping");
            return;
        }
        log.info("Seeding demo data...");
        allServiceTypes = serviceTypeRepository.findAll();
        seedAccounts();
        seedPlatformSettings();
        seedCustomers();
        seedCars();
        seedDrivers();
        seedTechnicians();
        seedRequests();
        seedQuotes();
        seedStatusHistories();
        seedServiceItems();
        seedInspectionReports();
        seedInvoices();
        seedPayments();
        seedReviews();
        seedTransportRequests();
        seedHomeServiceAssignments();
        log.info("Demo data seeded successfully");
    }

    private ServiceType st(int id) {
        return allServiceTypes.stream().filter(s -> s.getId() == id).findFirst().orElse(null);
    }

    private List<ServiceType> stList(int... ids) {
        List<ServiceType> list = new ArrayList<>();
        for (int id : ids) {
            ServiceType s = st(id);
            if (s != null) list.add(s);
        }
        return list;
    }

    private Customer customer1() { return customerRepository.findById(1L).orElse(null); }
    private Customer customer2() { return customerRepository.findByEmail("sara@test.com").orElse(null); }
    private Workshop w(Long id) { return workshopRepository.findById(id).orElse(null); }
    private CustomerCar car(Long id) { return customerCarRepository.findById(id).orElse(null); }

    private void seedAccounts() {
        Account parentAsset = accountRepository.save(Account.builder().code("1").name("الأصول").nameEn("Assets").type("ASSET").level(0).isSystem(true).build());
        Account parentLiability = accountRepository.save(Account.builder().code("2").name("الخصوم").nameEn("Liabilities").type("LIABILITY").level(0).isSystem(true).build());
        Account parentRevenue = accountRepository.save(Account.builder().code("3").name("الإيرادات").nameEn("Revenue").type("REVENUE").level(0).isSystem(true).build());
        Account parentExpense = accountRepository.save(Account.builder().code("4").name("المصروفات").nameEn("Expenses").type("EXPENSE").level(0).isSystem(true).build());

        accountRepository.save(Account.builder().code("1.1.1").name("الصندوق").nameEn("Cash on Hand").type("ASSET").parent(parentAsset).level(1).isSystem(true).build());
        accountRepository.save(Account.builder().code("1.1.2").name("البنك").nameEn("Bank Account").type("ASSET").parent(parentAsset).level(1).isSystem(true).build());
        accountRepository.save(Account.builder().code("1.2.1").name("محفظة مدفوعات").nameEn("Payment Wallet").type("ASSET").parent(parentAsset).level(1).isSystem(true).build());
        accountRepository.save(Account.builder().code("1.3.1").name("ذمم العملاء").nameEn("Accounts Receivable").type("ASSET").parent(parentAsset).level(1).isSystem(true).build());

        accountRepository.save(Account.builder().code("2.1.1").name("مستحقات الورش").nameEn("Workshop Payables").type("LIABILITY").parent(parentLiability).level(1).isSystem(true).build());
        accountRepository.save(Account.builder().code("2.2.1").name("ضريبة البيع").nameEn("Sales Tax").type("LIABILITY").parent(parentLiability).level(1).isSystem(true).build());

        accountRepository.save(Account.builder().code("3.1.1").name("إيراد العمولات").nameEn("Commission Revenue").type("REVENUE").parent(parentRevenue).level(1).isSystem(true).build());
        accountRepository.save(Account.builder().code("3.1.2").name("إيرادات أخرى").nameEn("Other Revenue").type("REVENUE").parent(parentRevenue).level(1).isSystem(true).build());

        accountRepository.save(Account.builder().code("4.1.1").name("رسوم بوابات الدفع").nameEn("Payment Gateway Fees").type("EXPENSE").parent(parentExpense).level(1).isSystem(true).build());
        accountRepository.save(Account.builder().code("4.1.2").name("مصروفات تشغيل").nameEn("Operating Expenses").type("EXPENSE").parent(parentExpense).level(1).isSystem(true).build());

        log.info("  Created 12 accounts");
    }

    private void seedPlatformSettings() {
        platformSettingRepository.save(PlatformSetting.builder()
                .settingKey("default_commission_percentage")
                .settingValue("10")
                .description("نسبة العمولة الافتراضية على الفواتير (%)")
                .build());
        log.info("  Created platform settings");
    }

    private void seedCustomers() {
        String pass = passwordEncoder.encode("123456");
        customerRepository.save(Customer.builder()
                .name("سارة العميل").phone("0566666666").email("sara@test.com")
                .password(pass).city("جدة").isActive(true)
                .emailVerifiedAt(LocalDateTime.now()).build());
        log.info("  Created customer: sara@test.com");
    }

    private void seedCars() {
        Customer ahmad = customer1();
        Customer sara = customer2();
        if (ahmad == null || sara == null) return;
        customerCarRepository.save(CustomerCar.builder().customer(ahmad).make("تويوتا").model("كامري").year(2022).plateNumber("ABC 1234").color("أبيض").mileage(150000).build());
        customerCarRepository.save(CustomerCar.builder().customer(ahmad).make("هيونداي").model("توسان").year(2021).plateNumber("XYZ 5678").color("فضي").mileage(82000).build());
        customerCarRepository.save(CustomerCar.builder().customer(ahmad).make("نيسان").model("ألتيما").year(2020).plateNumber("DEF 9012").color("أسود").build());
        customerCarRepository.save(CustomerCar.builder().customer(sara).make("مرسيدس").model("C300").year(2023).plateNumber("MNO 3456").color("أبيض").build());
        customerCarRepository.save(CustomerCar.builder().customer(sara).make("BMW").model("X5").year(2022).plateNumber("PQR 7890").color("أسود").build());
        log.info("  Created 5 cars");
    }

    private void seedDrivers() {
        String pass = passwordEncoder.encode("123456");
        driverRepository.save(Driver.builder().name("سامي النجار").phone("0571111111").email("sami@driver.com").password(pass).city("الرياض").vehicleType("ونش سحب").serviceMode("tow_truck").plateNumber("ونش 101").isActive(true).isApproved(true).latitude(24.7136).longitude(46.6753).isOnline(true).build());
        driverRepository.save(Driver.builder().name("عمر السالم").phone("0572222222").email("omar@driver.com").password(pass).city("جدة").vehicleType("شاحنة متنقلة").serviceMode("mobile_mechanic").plateNumber("متنقل 202").isActive(true).isApproved(true).latitude(21.4858).longitude(39.1925).isOnline(true).build());
        log.info("  Created 2 drivers");
    }

    private void seedTechnicians() {
        Workshop w1 = w(1L);
        Workshop w2 = w(2L);
        String pass = passwordEncoder.encode("123456");
        if (w1 != null) {
            technicianRepository.save(Technician.builder().name("خالد الفني").phone("0581111111").email("khalid@expert.com").password(pass).specialty("محركات وقير").workshop(w1).isActive(true).isOnline(true).build());
            technicianRepository.save(Technician.builder().name("ماجد الفني").phone("0582222222").email("majid@expert.com").password(pass).specialty("كهرباء وتكييف").workshop(w1).isActive(true).isOnline(true).build());
        }
        if (w2 != null) {
            technicianRepository.save(Technician.builder().name("فهد الفني").phone("0583333333").email("fahd@tech.com").password(pass).specialty("سمكرة ودهان").workshop(w2).isActive(true).isOnline(false).build());
            technicianRepository.save(Technician.builder().name("ناصر الفني").phone("0584444444").email("nasir@tech.com").password(pass).specialty("تكييف").workshop(w2).isActive(true).isOnline(true).build());
        }
        log.info("  Created 4 technicians");
    }

    private void seedRequests() {
        Customer ahmad = customer1();
        Customer sara = customer2();
        if (ahmad == null || sara == null) return;

        MaintenanceRequest r1 = MaintenanceRequest.builder()
                .customer(ahmad).car(car(1L))
                .serviceTypes(stList(1, 8))
                .description("تغيير زيت المحرك وفحص دوري شامل للسيارة").city("الرياض")
                .locationLat(24.7136).locationLng(46.6753).locationAddress("الرياض - حي النهضة")
                .status("paid").hasTransportRequest(false).allowMultiWorkshop(false).executionMethod("workshop").build();
        requestRepository.save(r1);

        MaintenanceRequest r2 = MaintenanceRequest.builder()
                .customer(ahmad).car(car(2L))
                .serviceTypes(stList(11, 21))
                .description("عمرة مكينة كاملة وعمرة قير أوتوماتيك").city("جدة")
                .locationLat(21.4858).locationLng(39.1925).locationAddress("جدة - حي السلامة")
                .status("in_progress").hasTransportRequest(true).allowMultiWorkshop(false).executionMethod("pickup_delivery").build();
        requestRepository.save(r2);

        MaintenanceRequest r3 = MaintenanceRequest.builder()
                .customer(ahmad).car(car(3L))
                .serviceTypes(stList(55, 57))
                .description("سمكرة ودهان كامل للسيارة بعد حادث بسيط").city("الدمام")
                .locationLat(26.4207).locationLng(50.0888).locationAddress("الدمام - حي العدامة")
                .status("quoted").hasTransportRequest(false).allowMultiWorkshop(true).executionMethod("workshop").build();
        requestRepository.save(r3);

        MaintenanceRequest r4 = MaintenanceRequest.builder()
                .customer(ahmad).car(car(1L))
                .serviceTypes(stList(63))
                .description("تغيير الإطارات الأربعة").city("الرياض")
                .locationLat(24.7136).locationLng(46.6753).locationAddress("الرياض - حي النهضة")
                .status("pending").hasTransportRequest(false).allowMultiWorkshop(false).executionMethod("workshop").build();
        requestRepository.save(r4);

        MaintenanceRequest r5 = MaintenanceRequest.builder()
                .customer(sara).car(car(4L))
                .serviceTypes(stList(47, 43))
                .description("المكيف ما يبرد والكهرباء فيها مشكلة").city("جدة")
                .locationLat(21.5433).locationLng(39.1728).locationAddress("جدة - حي الروضة")
                .status("inspection_report").hasTransportRequest(false).allowMultiWorkshop(false).executionMethod("mobile").build();
        requestRepository.save(r5);

        MaintenanceRequest r6 = MaintenanceRequest.builder()
                .customer(sara).car(car(5L))
                .serviceTypes(stList(57))
                .description("دهان كامل للسيارة بلون جديد").city("المدينة المنورة")
                .locationLat(24.5247).locationLng(39.5692).locationAddress("المدينة - حي العوالي")
                .status("completed").hasTransportRequest(false).allowMultiWorkshop(false).executionMethod("workshop").build();
        requestRepository.save(r6);

        log.info("  Created 6 requests");
    }

    private void seedQuotes() {
        Customer ahmad = customer1();
        List<MaintenanceRequest> all = requestRepository.findAll();

        MaintenanceRequest r1 = all.stream().filter(r -> {
            Customer c = r.getCustomer();
            return c != null && c.getId().equals(ahmad.getId()) && "paid".equals(r.getStatus());
        }).findFirst().orElse(null);
        MaintenanceRequest r2 = all.stream().filter(r -> {
            Customer c = r.getCustomer();
            return c != null && c.getId().equals(ahmad.getId()) && "in_progress".equals(r.getStatus());
        }).findFirst().orElse(null);
        MaintenanceRequest r3 = all.stream().filter(r -> {
            Customer c = r.getCustomer();
            return c != null && c.getId().equals(ahmad.getId()) && "quoted".equals(r.getStatus());
        }).findFirst().orElse(null);

        if (r1 != null) {
            quoteRepository.save(Quote.builder().request(r1).workshop(w(1L)).serviceType(st(1)).price(150.0).notes("زيت أصلي + فلتر أصلي").estimatedDays(1).warrantyMonths(6).status("accepted").build());
            quoteRepository.save(Quote.builder().request(r1).workshop(w(1L)).serviceType(st(8)).price(200.0).notes("فحص شامل لجميع الأنظمة").estimatedDays(1).warrantyMonths(3).status("accepted").build());
            quoteRepository.save(Quote.builder().request(r1).workshop(w(3L)).serviceType(null).price(400.0).notes("سعر شامل للخدمتين").estimatedDays(2).warrantyMonths(6).status("rejected").build());
        }

        if (r2 != null) {
            quoteRepository.save(Quote.builder().request(r2).workshop(w(2L)).serviceType(null).price(3500.0).notes("عمرة مكينة وقير شامل قطع غيار أصلية").estimatedDays(5).warrantyMonths(12).status("accepted").build());
            quoteRepository.save(Quote.builder().request(r2).workshop(w(4L)).serviceType(null).price(2800.0).notes("سعر مخفض باستخدام قطع تجارية").estimatedDays(7).warrantyMonths(6).status("rejected").build());
        }

        if (r3 != null) {
            quoteRepository.save(Quote.builder().request(r3).workshop(w(2L)).serviceType(null).price(800.0).notes("سمكرة ودهان لجانب واحد").estimatedDays(3).warrantyMonths(12).status("pending").build());
            quoteRepository.save(Quote.builder().request(r3).workshop(w(5L)).serviceType(null).price(950.0).notes("سمكرة ودهان كامل بجودة عالية").estimatedDays(4).warrantyMonths(18).status("pending").build());
        }

        MaintenanceRequest r5 = all.stream().filter(r -> "inspection_report".equals(r.getStatus())).findFirst().orElse(null);
        if (r5 != null) {
            quoteRepository.save(Quote.builder().request(r5).workshop(w(2L)).serviceType(null).price(1200.0).notes("فحص وإصلاح تكييف وكهرباء").estimatedDays(2).warrantyMonths(6).status("accepted").build());
        }

        MaintenanceRequest r6 = all.stream().filter(r -> "completed".equals(r.getStatus())).findFirst().orElse(null);
        if (r6 != null) {
            quoteRepository.save(Quote.builder().request(r6).workshop(w(5L)).serviceType(null).price(4000.0).notes("دهان كامل بمواد ألمانية مع ضمان").estimatedDays(5).warrantyMonths(24).status("accepted").build());
        }

        log.info("  Created quotes");
    }

    private void seedStatusHistories() {
        List<MaintenanceRequest> all = requestRepository.findAll();
        for (MaintenanceRequest r : all) {
            String[] statuses = switch (r.getStatus()) {
                case "paid" -> new String[]{"pending", "quoted", "accepted", "in_progress", "inspection_report", "completed", "paid"};
                case "in_progress" -> new String[]{"pending", "quoted", "accepted", "in_progress"};
                case "quoted" -> new String[]{"pending", "quoted"};
                case "inspection_report" -> new String[]{"pending", "quoted", "accepted", "in_progress", "inspection_report"};
                case "completed" -> new String[]{"pending", "quoted", "accepted", "in_progress", "inspection_report", "completed"};
                default -> new String[]{r.getStatus()};
            };
            Customer cust = r.getCustomer();
            Long custId = cust != null ? cust.getId() : 1L;
            for (int i = 0; i < statuses.length; i++) {
                statusHistoryRepository.save(RequestStatusHistory.builder()
                        .request(r).status(statuses[i])
                        .notes("تم تحديث الحالة إلى " + statuses[i])
                        .createdBy(i == 0 ? "customer:" + custId : "workshop:1")
                        .build());
            }
        }
        log.info("  Created status histories");
    }    private void seedServiceItems() {
        List<MaintenanceRequest> all = requestRepository.findAll();
        for (MaintenanceRequest r : all) {
            if (r.getServiceTypes() == null) continue;
            for (ServiceType s : r.getServiceTypes()) {
                if (s == null) continue;
                String siStatus = switch (r.getStatus()) {
                    case "paid" -> "COMPLETED";
                    case "in_progress" -> "ASSIGNED";
                    case "inspection_report" -> "ACCEPTED";
                    case "completed" -> "COMPLETED";
                    default -> "NEW";
                };
                serviceItemRepository.save(ServiceItem.builder()
                        .request(r).serviceType(s)
                        .status(siStatus).build());
            }
        }
        log.info("  Created service items");
    }

    private void seedInspectionReports() {
        MaintenanceRequest r1 = requestRepository.findAll().stream().filter(r -> "paid".equals(r.getStatus())).findFirst().orElse(null);
        MaintenanceRequest r5 = requestRepository.findAll().stream().filter(r -> "inspection_report".equals(r.getStatus())).findFirst().orElse(null);
        MaintenanceRequest r6 = requestRepository.findAll().stream().filter(r -> "completed".equals(r.getStatus())).findFirst().orElse(null);

        if (r1 != null) {
            InspectionReport report = inspectionReportRepository.save(InspectionReport.builder()
                    .request(r1).workshop(w(1L)).notes("السيارة بحالة جيدة - زيت المحرك يحتاج تغيير - الفحص الشامل سليم")
                    .totalParts(120.0).totalLabor(200.0).tax(48.0).grandTotal(368.0)
                    .overallCondition("جيد").recommendations("تغيير الزيت كل 5000 كم").mileage(45000)
                    .nextServiceDate(LocalDate.now().plusMonths(3)).nextServiceMileage(50000).status("approved").build());

            inspectionPartItemRepository.save(InspectionPartItem.builder().report(report).partName("فلتر زيت أصلي").quantity(1).unitPrice(45.0).total(45.0).build());
            inspectionPartItemRepository.save(InspectionPartItem.builder().report(report).partName("زيت محرك 5W30 (4 لتر)").quantity(1).unitPrice(75.0).total(75.0).build());
            inspectionLaborItemRepository.save(InspectionLaborItem.builder().report(report).description("تغيير زيت وفلتر").hours(0.5).hourlyRate(100.0).total(50.0).build());
            inspectionLaborItemRepository.save(InspectionLaborItem.builder().report(report).description("فحص دوري شامل").hours(1.5).hourlyRate(100.0).total(150.0).build());
            inspectionChecklistItemRepository.save(InspectionChecklistItem.builder().report(report).category("engine").itemName("مستوى الزيت").status("good").sortOrder(1).build());
            inspectionChecklistItemRepository.save(InspectionChecklistItem.builder().report(report).category("engine").itemName("فلتر الزيت").status("fair").sortOrder(2).notes("يحتاج تغيير").build());
            inspectionChecklistItemRepository.save(InspectionChecklistItem.builder().report(report).category("brakes").itemName("الفرامل الأمامية").status("good").sortOrder(3).build());
            inspectionChecklistItemRepository.save(InspectionChecklistItem.builder().report(report).category("tires").itemName("الإطارات").status("good").sortOrder(4).build());
        }

        if (r5 != null) {
            InspectionReport report = inspectionReportRepository.save(InspectionReport.builder()
                    .request(r5).workshop(w(2L)).notes("مشكلة في ضاغط المكيف - تحتاج أسلاك كهرباء")
                    .totalParts(850.0).totalLabor(350.0).tax(180.0).grandTotal(1380.0)
                    .overallCondition("مقبول").recommendations("تغيير ضاغط المكيف وإصلاح الأسلاك").mileage(30000)
                    .nextServiceDate(LocalDate.now().plusMonths(6)).nextServiceMileage(35000).status("pending_approval").build());

            inspectionPartItemRepository.save(InspectionPartItem.builder().report(report).partName("ضاغط مكيف").quantity(1).unitPrice(650.0).total(650.0).build());
            inspectionPartItemRepository.save(InspectionPartItem.builder().report(report).partName("أسلاك كهرباء (طقم)").quantity(1).unitPrice(200.0).total(200.0).build());
            inspectionLaborItemRepository.save(InspectionLaborItem.builder().report(report).description("تشخيص وإصلاح المكيف").hours(2.0).hourlyRate(100.0).total(200.0).build());
            inspectionLaborItemRepository.save(InspectionLaborItem.builder().report(report).description("فحص وإصلاح الكهرباء").hours(1.5).hourlyRate(100.0).total(150.0).build());
            inspectionChecklistItemRepository.save(InspectionChecklistItem.builder().report(report).category("ac").itemName("ضاغط المكيف").status("poor").sortOrder(1).notes("لا يعمل - يحتاج تغيير").build());
            inspectionChecklistItemRepository.save(InspectionChecklistItem.builder().report(report).category("ac").itemName("غاز المكيف").status("poor").sortOrder(2).notes("نسبة الغاز منخفضة جداً").build());
            inspectionChecklistItemRepository.save(InspectionChecklistItem.builder().report(report).category("electrical").itemName("الأسلاك والفيش").status("fair").sortOrder(3).notes("بعض الأسلاك متآكلة").build());
            inspectionChecklistItemRepository.save(InspectionChecklistItem.builder().report(report).category("electrical").itemName("البطارية").status("good").sortOrder(4).build());
        }

        if (r6 != null) {
            InspectionReport report = inspectionReportRepository.save(InspectionReport.builder()
                    .request(r6).workshop(w(5L)).notes("الدهان القديم متآكل - يحتاج دهان كامل")
                    .totalParts(1500.0).totalLabor(2000.0).tax(525.0).grandTotal(4025.0)
                    .overallCondition("سيئ").recommendations("دهان كامل مع إصلاح الصدأ").mileage(55000)
                    .nextServiceDate(LocalDate.now().plusMonths(1)).nextServiceMileage(56000).status("approved").build());

            inspectionPartItemRepository.save(InspectionPartItem.builder().report(report).partName("معجون سمكرة").quantity(2).unitPrice(150.0).total(300.0).build());
            inspectionPartItemRepository.save(InspectionPartItem.builder().report(report).partName("دهان ألماني (كامل)").quantity(1).unitPrice(1000.0).total(1000.0).build());
            inspectionPartItemRepository.save(InspectionPartItem.builder().report(report).partName("ورنيش").quantity(1).unitPrice(200.0).total(200.0).build());
            inspectionLaborItemRepository.save(InspectionLaborItem.builder().report(report).description("سمكرة وإصلاح صدمات").hours(8.0).hourlyRate(125.0).total(1000.0).build());
            inspectionLaborItemRepository.save(InspectionLaborItem.builder().report(report).description("دهان كامل").hours(8.0).hourlyRate(125.0).total(1000.0).build());
            inspectionChecklistItemRepository.save(InspectionChecklistItem.builder().report(report).category("bodywork").itemName("الهيكل الخارجي").status("poor").sortOrder(1).notes("صدأ في الرفرف الأمامي").build());
            inspectionChecklistItemRepository.save(InspectionChecklistItem.builder().report(report).category("bodywork").itemName("الصدامات").status("fair").sortOrder(2).build());
        }

        log.info("  Created inspection reports with items");
    }

    private void seedInvoices() {
        MaintenanceRequest r1 = requestRepository.findAll().stream().filter(r -> "paid".equals(r.getStatus())).findFirst().orElse(null);
        MaintenanceRequest r6 = requestRepository.findAll().stream().filter(r -> "completed".equals(r.getStatus())).findFirst().orElse(null);

        if (r1 != null) {
            Invoice inv = invoiceRepository.save(Invoice.builder()
                    .request(r1).customer(r1.getCustomer()).workshop(w(1L))
                    .invoiceNumber("INV-20260601-0001")
                    .partsTotal(120.0).laborTotal(200.0).totalAmount(320.0).tax(48.0).grandTotal(368.0)
                    .status("paid").paymentMethod("demo").paymentId("DEMO-SEED-001").paidAt(LocalDateTime.now())
                    .commissionPercentage(10.0).commissionAmount(36.8).netAmount(331.2)
                    .build());
            invoiceItemRepository.save(InvoiceItem.builder().invoice(inv).name("فلتر زيت أصلي").quantity(1).unitPrice(45.0).total(45.0).build());
            invoiceItemRepository.save(InvoiceItem.builder().invoice(inv).name("زيت محرك 5W30").quantity(1).unitPrice(75.0).total(75.0).build());
            invoiceItemRepository.save(InvoiceItem.builder().invoice(inv).name("تغيير زيت وفلتر (شغل)").quantity(1).unitPrice(50.0).total(50.0).build());
            invoiceItemRepository.save(InvoiceItem.builder().invoice(inv).name("فحص دوري شامل (شغل)").quantity(1).unitPrice(150.0).total(150.0).build());
        }

        if (r6 != null) {
            Invoice inv = invoiceRepository.save(Invoice.builder()
                    .request(r6).customer(r6.getCustomer()).workshop(w(5L))
                    .invoiceNumber("INV-20260602-0001")
                    .partsTotal(1500.0).laborTotal(2000.0).totalAmount(3500.0).tax(525.0).grandTotal(4025.0)
                    .status("pending_approval")
                    .build());
            invoiceItemRepository.save(InvoiceItem.builder().invoice(inv).name("معجون سمكرة").quantity(2).unitPrice(150.0).total(300.0).build());
            invoiceItemRepository.save(InvoiceItem.builder().invoice(inv).name("دهان ألماني").quantity(1).unitPrice(1000.0).total(1000.0).build());
            invoiceItemRepository.save(InvoiceItem.builder().invoice(inv).name("ورنيش").quantity(1).unitPrice(200.0).total(200.0).build());
            invoiceItemRepository.save(InvoiceItem.builder().invoice(inv).name("سمكرة (شغل)").quantity(8).unitPrice(125.0).total(1000.0).build());
            invoiceItemRepository.save(InvoiceItem.builder().invoice(inv).name("دهان (شغل)").quantity(8).unitPrice(125.0).total(1000.0).build());
        }

        log.info("  Created invoices with items");
    }

    private void seedPayments() {
        MaintenanceRequest r1 = requestRepository.findAll().stream().filter(r -> "paid".equals(r.getStatus())).findFirst().orElse(null);
        if (r1 != null) {
            paymentRepository.save(Payment.builder()
                    .request(r1).customer(r1.getCustomer())
                    .amount(368.0).fee(0.0).total(368.0)
                    .currency("SAR").method("demo").status("completed")
                    .moyasarPaymentId("DEMO-SEED-001").build());
        }
        log.info("  Created payments");
    }

    private void seedReviews() {
        MaintenanceRequest r1 = requestRepository.findAll().stream().filter(r -> "paid".equals(r.getStatus())).findFirst().orElse(null);
        if (r1 != null && w(1L) != null) {
            reviewRepository.save(Review.builder()
                    .request(r1).customer(r1.getCustomer()).workshop(w(1L))
                    .rating(4).comment("ورشة ممتازة، شغل نظيف وسريع. السعر مناسب والموظفين محترفين").build());
        }
        log.info("  Created reviews");
    }

    private void seedTransportRequests() {
        MaintenanceRequest r2 = requestRepository.findAll().stream().filter(r -> "in_progress".equals(r.getStatus())).findFirst().orElse(null);
        Driver sami = driverRepository.findByEmail("sami@driver.com").orElse(null);
        if (r2 != null && sami != null) {
            transportRequestRepository.save(TransportRequest.builder()
                    .request(r2).customer(r2.getCustomer()).driver(sami)
                    .pickupLat(21.4858).pickupLng(39.1925).pickupAddress("جدة - حي السلامة - منزل العميل")
                    .dropoffLat(21.5433).dropoffLng(39.1728).dropoffAddress("جدة - حي الروضة - ورشة التقنية")
                    .status("in_progress").price(50.0).distance(8.5).estimatedTime(20).build());
        }
        log.info("  Created transport requests");
    }

    private void seedHomeServiceAssignments() {
        MaintenanceRequest r2 = requestRepository.findAll().stream().filter(r -> "in_progress".equals(r.getStatus())).findFirst().orElse(null);
        var technicians = technicianRepository.findAll();
        Technician khalid = technicians.stream().filter(t -> "خالد الفني".equals(t.getName())).findFirst().orElse(null);
        if (r2 != null && khalid != null) {
            homeServiceAssignmentRepository.save(HomeServiceAssignment.builder()
                    .request(r2).technician(khalid).workshop(khalid.getWorkshop())
                    .status("assigned").customerNotes("يفضل الزيارة بعد العصر").build());
        }
        log.info("  Created home service assignments");
    }
}
