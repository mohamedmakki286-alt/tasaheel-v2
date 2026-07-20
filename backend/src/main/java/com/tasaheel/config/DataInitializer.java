package com.tasaheel.config;

import com.tasaheel.entity.Customer;
import com.tasaheel.entity.ServiceCategory;
import com.tasaheel.entity.ServiceTemplate;
import com.tasaheel.entity.ServiceType;
import com.tasaheel.entity.Workshop;
import com.tasaheel.entity.WorkshopService;
import com.tasaheel.entity.WorkshopServiceListing;
import com.tasaheel.repository.CustomerRepository;
import com.tasaheel.repository.ServiceCategoryRepository;
import com.tasaheel.repository.ServiceTemplateRepository;
import com.tasaheel.repository.ServiceTypeRepository;
import com.tasaheel.repository.WorkshopRepository;
import com.tasaheel.repository.WorkshopServiceRepository;
import com.tasaheel.repository.WorkshopServiceListingRepository;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.time.LocalDateTime;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final ServiceTypeRepository serviceTypeRepository;
    private final ServiceCategoryRepository serviceCategoryRepository;
    private final ServiceTemplateRepository serviceTemplateRepository;
    private final CustomerRepository customerRepository;
    private final WorkshopRepository workshopRepository;
    private final WorkshopServiceRepository workshopServiceRepository;
    private final WorkshopServiceListingRepository workshopServiceListingRepository;
    private final PasswordEncoder passwordEncoder;
    private final EntityManager entityManager;

    @Override
    @Transactional
    public void run(String... args) {
        String password = passwordEncoder.encode("123456");
        clearAllData();
        seedCategories();
        seedServiceTemplates();
        seedServiceTypes();
        seedWashingServices();
        seedEstimatedDurations();
        seedCustomer(password);
        seedWorkshops(password);
        seedWorkshopServices();
        seedWorkshopServiceListings();
        log.info("Database seeded: {} categories, {} templates, {} service types, {} listings",
                serviceCategoryRepository.count(), serviceTemplateRepository.count(), serviceTypeRepository.count(), workshopServiceListingRepository.count());
    }

    private void clearAllData() {
        entityManager.createNativeQuery("DELETE FROM workshop_gallery").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM service_audit_log").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM service_images").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM service_pricing").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM workshop_service_listings").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM service_templates").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM service_categories").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM home_service_assignments").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM transport_requests").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM reviews").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM payments").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM invoice_items").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM invoices").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM inspection_checklist_items").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM inspection_labor_items").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM inspection_part_items").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM inspection_reports").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM quotes").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM service_items").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM request_status_history").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM request_service_types").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM maintenance_requests").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM customer_cars").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM technicians").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM drivers").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM workshop_services").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM workshops").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM customers").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM accounts").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM platform_settings").executeUpdate();
        entityManager.createNativeQuery("DELETE FROM service_types").executeUpdate();
        log.info("Cleared all existing data");
    }

    private void seedCategories() {
        String[][] categories = {
            {"الصيانة الدورية", "periodic", "🔧"},
            {"الميكانيكا", "mechanical", "⚙️"},
            {"الكهرباء", "electrical", "⚡"},
            {"التكييف", "ac", "❄️"},
            {"الإطارات", "tires", "🛞"},
            {"السمكرة والدهان", "bodywork", "🎨"},
            {"الطوارئ", "emergency", "🚨"},
            {"الفحص والتقييم", "inspection", "🔍"},
        };
        for (int i = 0; i < categories.length; i++) {
            String[] c = categories[i];
            if (!serviceCategoryRepository.existsByNameIgnoreCase(c[0])) {
                serviceCategoryRepository.save(ServiceCategory.builder()
                    .name(c[0])
                    .nameEn(c[1])
                    .icon(c[2])
                    .displayOrder(i)
                    .isActive(true)
                    .build());
            } else {
                ServiceCategory existing = serviceCategoryRepository.findByNameIgnoreCase(c[0]).orElse(null);
                if (existing != null && (existing.getIcon() == null || existing.getIcon().isEmpty())) {
                    existing.setIcon(c[2]);
                    serviceCategoryRepository.save(existing);
                }
            }
        }
    }

    private void seedEstimatedDurations() {
        String[][] durations = {
            {"تغيير زيت المحرك", "٢٠-٣٠ دقيقة"},
            {"تغيير فلتر الهواء", "١٠-١٥ دقيقة"},
            {"تغيير فلتر المكيف", "١٥-٢٠ دقيقة"},
            {"تغيير شمعات الاحتراق", "٣٠-٤٥ دقيقة"},
            {"تغيير زيت القير", "٣٠-٤٥ دقيقة"},
            {"تغيير زيت الفرامل", "٢٠-٣٠ دقيقة"},
            {"تغيير ماء الردياتير", "٢٠-٣٠ دقيقة"},
            {"فحص دوري شامل", "٤٥-٦٠ دقيقة"},
            {"تغيير سير المكينة", "٣٠-٤٥ دقيقة"},
            {"تغيير فلتر البنزين", "٢٠-٣٠ دقيقة"},
            {"عمرة مكينة", "٣-٥ أيام"},
            {"تغيير وجه سلندر", "٢-٣ أيام"},
            {"تغيير طرمبة الزيت", "٢-٤ ساعات"},
            {"تغيير طرمبة الماء", "٢-٣ ساعات"},
            {"تغيير كراسي المكينة", "١-٢ ساعة"},
            {"تغيير ديناميكيات المكينة", "٢-٣ ساعات"},
            {"إصلاح تسريبات زيت", "١-٢ ساعة"},
            {"تنظيف البخاخات", "١-٢ ساعة"},
            {"تغيير حساس الأكسجين", "٣٠-٤٥ دقيقة"},
            {"تغيير طرمبة البنزين", "١-٢ ساعة"},
            {"عمرة قير أوتوماتيك", "٢-٤ أيام"},
            {"عمرة قير عادي", "١-٣ أيام"},
            {"تغيير كلتش", "٣-٦ ساعات"},
            {"تغيير دبل", "٢-٤ ساعات"},
            {"تغيير زيت الدفرنس", "٣٠-٤٥ دقيقة"},
            {"تغيير عمود كردان", "١-٢ ساعة"},
            {"تغيير مساعدات", "١-٢ ساعة"},
            {"تغيير يايات", "١-٢ ساعة"},
            {"تغيير جلنط", "٣٠-٤٥ دقيقة"},
            {"تغيير ذراع سفلي", "٣٠-٤٥ دقيقة"},
            {"تغيير مقصات", "٣٠-٤٥ دقيقة"},
            {"تغيير اكسس", "١-٢ ساعة"},
            {"تغيير فرامل أمامية", "١-٢ ساعة"},
            {"تغيير فرامل خلفية", "١-٢ ساعة"},
            {"تغيير طرمبة فرامل", "١-٢ ساعة"},
            {"تغيير اسطوانات فرامل", "١-٢ ساعة"},
            {"تغيير دينمو", "٣٠-٤٥ دقيقة"},
            {"تغيير سلف", "٣٠-٤٥ دقيقة"},
            {"تغيير بطارية", "١٠-١٥ دقيقة"},
            {"تغيير كويل", "٣٠-٤٥ دقيقة"},
            {"برمجة كمبيوتر", "١-٢ ساعة"},
            {"تغيير حساسات", "٣٠-٤٥ دقيقة"},
            {"إصلاح أسواريم", "١-٣ ساعات"},
            {"تغيير لمبات", "١٥-٣٠ دقيقة"},
            {"تركيب نظام صوت", "١-٢ ساعة"},
            {"تركيب إنذار", "١-٢ ساعة"},
            {"شحن فلور", "٣٠-٤٥ دقيقة"},
            {"تغيير كمبروسر", "٢-٣ ساعات"},
            {"تغيير ثرمستات", "٣٠-٤٥ دقيقة"},
            {"تغيير مروحة ردياتير", "٣٠-٤٥ دقيقة"},
            {"تغيير ردياتير", "١-٢ ساعة"},
            {"تغيير طرمبة مكيف", "٢-٣ ساعات"},
            {"غسيل ردياتير", "٣٠-٤٥ دقيقة"},
            {"تغيير مبخر", "٢-٤ ساعات"},
            {"سمكرة", "١-٣ ساعات"},
            {"دوكو", "١-٢ يوم"},
            {"دهان كامل", "٣-٥ أيام"},
            {"معجون", "١-٢ ساعة"},
            {"تلميع سيارات", "٢-٤ ساعات"},
            {"إصلاح زجاج", "١-٢ ساعة"},
            {"تظليل", "٢-٣ ساعات"},
            {"ونش سحاب", "٣٠-٦٠ دقيقة"},
            {"تغيير إطار", "١٥-٣٠ دقيقة"},
            {"بنزين طوارئ", "١٥-٣٠ دقيقة"},
            {"فتح باب", "١٠-٢٠ دقيقة"},
            {"شحن بطارية", "١٠-١٥ دقيقة"},
            {"ترحيل سيارة", "يعتمد على المسافة"},
        };
        for (String[] d : durations) {
            serviceTypeRepository.findByName(d[0]).ifPresent(st -> {
                st.setEstimatedDuration(d[1]);
                serviceTypeRepository.save(st);
            });
        }
    }

    private Object[][] getServiceTypeData() {
        return new Object[][] {
            {"تغيير زيت المحرك", "Oil Change", "oil-drop", "تغيير زيت المحرك مع فلتر الزيت", "periodic"},
            {"تغيير فلتر الهواء", "Air Filter Replacement", "air-filter", "تغيير فلتر هواء المحرك", "periodic"},
            {"تغيير فلتر المكيف", "Cabin Filter Replacement", "ac-filter", "تغيير فلتر هواء المكيف", "periodic"},
            {"تغيير شمعات الاحتراق", "Spark Plugs Replacement", "spark-plug", "تغيير بوجيات المحرك", "periodic"},
            {"تغيير زيت القير", "Transmission Oil Change", "gearbox-oil", "تغيير زيت ناقل الحركة", "periodic"},
            {"تغيير زيت الفرامل", "Brake Fluid Change", "brake-fluid", "تغيير زيت الفرامل", "periodic"},
            {"تغيير ماء الردياتير", "Coolant Change", "coolant", "تغيير ماء التبريد", "periodic"},
            {"فحص دوري شامل", "Periodic Inspection", "inspection", "فحص شامل للسيارة", "periodic"},
            {"تغيير سير المكينة", "Serpentine Belt Replacement", "belt", "تغيير سير المكينة", "periodic"},
            {"تغيير فلتر البنزين", "Fuel Filter Replacement", "fuel-filter", "تغيير فلتر الوقود", "periodic"},

            {"عمرة مكينة", "Engine Overhaul", "engine-overhaul", "عمرة كاملة للمحرك", "mechanical"},
            {"تغيير وجه سلندر", "Head Gasket Replacement", "head-gasket", "تغيير وجه السلندر", "mechanical"},
            {"تغيير طرمبة الزيت", "Oil Pump Replacement", "oil-pump", "تغيير طرمبة الزيت", "mechanical"},
            {"تغيير طرمبة الماء", "Water Pump Replacement", "water-pump", "تغيير طرمبة الماء", "mechanical"},
            {"تغيير كراسي المكينة", "Engine Mounts Replacement", "engine-mount", "تغيير كراسي المكينة", "mechanical"},
            {"تغيير ديناميكيات المكينة", "Engine Timing Service", "timing", "تغيير ديناميكيات المكينة", "mechanical"},
            {"إصلاح تسريبات زيت", "Oil Leak Repair", "oil-leak", "إصلاح تسريبات زيت المحرك", "mechanical"},
            {"تنظيف البخاخات", "Fuel Injector Cleaning", "injector", "تنظيف بخاخات الوقود", "mechanical"},
            {"تغيير حساس الأكسجين", "O2 Sensor Replacement", "o2-sensor", "تغيير حساس الأكسجين", "mechanical"},
            {"تغيير طرمبة البنزين", "Fuel Pump Replacement", "fuel-pump", "تغيير طرمبة البنزين", "mechanical"},

            {"عمرة قير أوتوماتيك", "Automatic Transmission Overhaul", "auto-gearbox", "عمرة قير أوتوماتيك", "mechanical"},
            {"عمرة قير عادي", "Manual Transmission Overhaul", "manual-gearbox", "عمرة قير يدوي", "mechanical"},
            {"تغيير كلتش", "Clutch Replacement", "clutch", "تغيير طقم الكلتش", "mechanical"},
            {"تغيير دبل", "Transfer Case Service", "transfer-case", "صيانة الدبل", "mechanical"},
            {"تغيير زيت الدفرنس", "Differential Oil Change", "differential", "تغيير زيت الدفرنس", "mechanical"},
            {"تغيير عمود كردان", "Driveshaft Replacement", "driveshaft", "تغيير عمود الكردان", "mechanical"},

            {"تغيير مساعدات", "Shock Absorbers Replacement", "shock", "تغيير المساعدات الأمامية والخلفية", "mechanical"},
            {"تغيير يايات", "Springs Replacement", "spring", "تغيير اليايات", "mechanical"},
            {"تغيير جلنط", "Ball Joint Replacement", "ball-joint", "تغيير الجلنط", "mechanical"},
            {"تغيير ذراع سفلي", "Control Arm Replacement", "control-arm", "تغيير الذراع السفلي", "mechanical"},
            {"تغيير مقصات", "Tie Rods Replacement", "tie-rod", "تغيير المقصات", "mechanical"},
            {"تغيير اكسس", "Axle Replacement", "axle", "تغيير الاكسس", "mechanical"},
            {"تغيير فرامل أمامية", "Front Brakes Replacement", "brake-front", "تغيير فرامل أمامية (بان + قماش)", "mechanical"},
            {"تغيير فرامل خلفية", "Rear Brakes Replacement", "brake-rear", "تغيير فرامل خلفية", "mechanical"},
            {"تغيير طرمبة فرامل", "Brake Master Pump Replacement", "brake-pump", "تغيير طرمبة الفرامل", "mechanical"},
            {"تغيير اسطوانات فرامل", "Brake Cylinder Replacement", "brake-cylinder", "تغيير اسطوانات الفرامل", "mechanical"},

            {"تغيير دينمو", "Alternator Replacement", "alternator", "تغيير دينمو السيارة", "electrical"},
            {"تغيير سلف", "Starter Replacement", "starter", "تغيير سلف السيارة", "electrical"},
            {"تغيير بطارية", "Battery Replacement", "battery", "تغيير بطارية السيارة", "electrical"},
            {"تغيير كويل", "Ignition Coil Replacement", "coil", "تغيير كويل الاشعال", "electrical"},
            {"برمجة كمبيوتر", "ECU Programming", "ecu", "برمجة كمبيوتر السيارة", "electrical"},
            {"تغيير حساسات", "Sensors Replacement", "sensor", "تغيير جميع أنواع الحساسات", "electrical"},
            {"إصلاح أسواريم", "Wiring Repair", "wiring", "إصلاح الأسواريم الكهربائية", "electrical"},
            {"تغيير لمبات", "Bulbs Replacement", "bulb", "تغيير لمبات السيارة", "electrical"},
            {"تركيب نظام صوت", "Audio System Installation", "audio", "تركيب مسجل وسماعات", "electrical"},
            {"تركيب إنذار", "Alarm Installation", "alarm", "تركيب نظام إنذار", "electrical"},

            {"شحن فلور", "AC Gas Refill", "ac-gas", "شحن فلور المكيف", "ac"},
            {"تغيير كمبروسر", "AC Compressor Replacement", "ac-compressor", "تغيير كمبروسر المكيف", "ac"},
            {"تغيير ثرمستات", "Thermostat Replacement", "thermostat", "تغيير الثرمستات", "ac"},
            {"تغيير مروحة ردياتير", "Radiator Fan Replacement", "radiator-fan", "تغيير مروحة الردياتير", "ac"},
            {"تغيير ردياتير", "Radiator Replacement", "radiator", "تغيير ردياتير الماء", "ac"},
            {"تغيير طرمبة مكيف", "AC Pump Replacement", "ac-pump", "تغيير طرمبة المكيف", "ac"},
            {"غسيل ردياتير", "Radiator Flush", "radiator-flush", "غسيل ردياتير المكيف", "ac"},
            {"تغيير مبخر", "AC Evaporator Replacement", "ac-evaporator", "تغيير مبخر المكيف", "ac"},

            {"سمكرة", "Dent Repair", "dent", "سمكرة وإصلاح الصدامات", "bodywork"},
            {"دوكو", "Painting", "paint", "دهان أجزاء السيارة", "bodywork"},
            {"دهان كامل", "Full Paint Job", "full-paint", "دهان السيارة كاملة", "bodywork"},
            {"معجون", "Body Filler", "filler", "معجون سمكرة", "bodywork"},
            {"تلميع سيارات", "Car Polishing", "polish", "تلميع السيارة", "bodywork"},
            {"إصلاح زجاج", "Glass Repair", "glass", "إصلاح أو تغيير زجاج السيارة", "bodywork"},
            {"تظليل", "Window Tinting", "tint", "تظليل زجاج السيارة", "bodywork"},

            {"ونش سحاب", "Tow Truck", "tow", "خدمة الونش وسحب السيارات المتعطلة", "emergency"},
            {"تغيير إطار", "Tire Change", "tire", "تغيير إطار السيارة", "tires"},
            {"بنزين طوارئ", "Emergency Fuel", "fuel", "توصيل بنزين للطوارئ", "emergency"},
            {"فتح باب", "Car Unlock", "unlock", "فتح باب السيارة المقفول", "emergency"},
            {"شحن بطارية", "Battery Jump Start", "jump-start", "شحن بطارية السيارة", "emergency"},
            {"ترحيل سيارة", "Car Transport", "transport", "ترحيل السيارة", "emergency"},
            {"فحص قبل الشراء", "Pre-Purchase Inspection", "pre-purchase", "فحص قبل شراء السيارة", "inspection"},
            {"تقرير حالة السيارة", "Vehicle Condition Report", "condition-report", "تقرير مفصل عن حالة السيارة", "inspection"},
        };
    }

    private void seedServiceTemplates() {
        Object[][] templates = {
            // الصيانة الدورية
            {"تغيير زيت المحرك", "Oil Change", "٢٠-٣٠ دقيقة", "تغيير زيت المحرك مع فلتر الزيت", "oil-drop", "الصيانة الدورية"},
            {"تغيير فلتر الهواء", "Air Filter Replacement", "١٠-١٥ دقيقة", "تغيير فلتر هواء المحرك", "air-filter", "الصيانة الدورية"},
            {"تغيير فلتر المكيف", "Cabin Filter Replacement", "١٥-٢٠ دقيقة", "تغيير فلتر هواء المكيف", "ac-filter", "الصيانة الدورية"},
            {"تغيير شمعات الاحتراق", "Spark Plugs Replacement", "٣٠-٤٥ دقيقة", "تغيير بوجيات المحرك", "spark-plug", "الصيانة الدورية"},
            {"تغيير زيت القير", "Transmission Oil Change", "٣٠-٤٥ دقيقة", "تغيير زيت ناقل الحركة", "gearbox-oil", "الصيانة الدورية"},
            {"تغيير زيت الفرامل", "Brake Fluid Change", "٢٠-٣٠ دقيقة", "تغيير زيت الفرامل", "brake-fluid", "الصيانة الدورية"},
            {"تغيير ماء الردياتير", "Coolant Change", "٢٠-٣٠ دقيقة", "تغيير ماء التبريد", "coolant", "الصيانة الدورية"},
            {"فحص دوري شامل", "Periodic Inspection", "٤٥-٦٠ دقيقة", "فحص شامل للسيارة", "inspection", "الصيانة الدورية"},
            {"تغيير سير المكينة", "Serpentine Belt Replacement", "٣٠-٤٥ دقيقة", "تغيير سير المكينة", "belt", "الصيانة الدورية"},
            {"تغيير فلتر البنزين", "Fuel Filter Replacement", "٢٠-٣٠ دقيقة", "تغيير فلتر الوقود", "fuel-filter", "الصيانة الدورية"},

            // الميكانيكا
            {"عمرة مكينة", "Engine Overhaul", "٣-٥ أيام", "عمرة كاملة للمحرك", "engine-overhaul", "الميكانيكا"},
            {"تغيير وجه سلندر", "Head Gasket Replacement", "٢-٣ أيام", "تغيير وجه السلندر", "head-gasket", "الميكانيكا"},
            {"تغيير طرمبة الزيت", "Oil Pump Replacement", "٢-٤ ساعات", "تغيير طرمبة الزيت", "oil-pump", "الميكانيكا"},
            {"تغيير طرمبة الماء", "Water Pump Replacement", "٢-٣ ساعات", "تغيير طرمبة الماء", "water-pump", "الميكانيكا"},
            {"تغيير كراسي المكينة", "Engine Mounts Replacement", "١-٢ ساعة", "تغيير كراسي المكينة", "engine-mount", "الميكانيكا"},
            {"تغيير ديناميكيات المكينة", "Engine Timing Service", "٢-٣ ساعات", "تغيير ديناميكيات المكينة", "timing", "الميكانيكا"},
            {"إصلاح تسريبات زيت", "Oil Leak Repair", "١-٢ ساعة", "إصلاح تسريبات زيت المحرك", "oil-leak", "الميكانيكا"},
            {"تنظيف البخاخات", "Fuel Injector Cleaning", "١-٢ ساعة", "تنظيف بخاخات الوقود", "injector", "الميكانيكا"},
            {"تغيير حساس الأكسجين", "O2 Sensor Replacement", "٣٠-٤٥ دقيقة", "تغيير حساس الأكسجين", "o2-sensor", "الميكانيكا"},
            {"تغيير طرمبة البنزين", "Fuel Pump Replacement", "١-٢ ساعة", "تغيير طرمبة البنزين", "fuel-pump", "الميكانيكا"},
            {"عمرة قير أوتوماتيك", "Automatic Transmission Overhaul", "٢-٤ أيام", "عمرة قير أوتوماتيك", "auto-gearbox", "الميكانيكا"},
            {"عمرة قير عادي", "Manual Transmission Overhaul", "١-٣ أيام", "عمرة قير يدوي", "manual-gearbox", "الميكانيكا"},
            {"تغيير كلتش", "Clutch Replacement", "٣-٦ ساعات", "تغيير طقم الكلتش", "clutch", "الميكانيكا"},
            {"تغيير دبل", "Transfer Case Service", "٢-٤ ساعات", "صيانة الدبل", "transfer-case", "الميكانيكا"},
            {"تغيير زيت الدفرنس", "Differential Oil Change", "٣٠-٤٥ دقيقة", "تغيير زيت الدفرنس", "differential", "الميكانيكا"},
            {"تغيير عمود كردان", "Driveshaft Replacement", "١-٢ ساعة", "تغيير عمود الكردان", "driveshaft", "الميكانيكا"},
            {"تغيير مساعدات", "Shock Absorbers Replacement", "١-٢ ساعة", "تغيير المساعدات الأمامية والخلفية", "shock", "الميكانيكا"},
            {"تغيير يايات", "Springs Replacement", "١-٢ ساعة", "تغيير اليايات", "spring", "الميكانيكا"},
            {"تغيير جلنط", "Ball Joint Replacement", "٣٠-٤٥ دقيقة", "تغيير الجلنط", "ball-joint", "الميكانيكا"},
            {"تغيير ذراع سفلي", "Control Arm Replacement", "٣٠-٤٥ دقيقة", "تغيير الذراع السفلي", "control-arm", "الميكانيكا"},
            {"تغيير مقصات", "Tie Rods Replacement", "٣٠-٤٥ دقيقة", "تغيير المقصات", "tie-rod", "الميكانيكا"},
            {"تغيير اكسس", "Axle Replacement", "١-٢ ساعة", "تغيير الاكسس", "axle", "الميكانيكا"},
            {"تغيير فرامل أمامية", "Front Brakes Replacement", "١-٢ ساعة", "تغيير فرامل أمامية (بان + قماش)", "brake-front", "الميكانيكا"},
            {"تغيير فرامل خلفية", "Rear Brakes Replacement", "١-٢ ساعة", "تغيير فرامل خلفية", "brake-rear", "الميكانيكا"},
            {"تغيير طرمبة فرامل", "Brake Master Pump Replacement", "١-٢ ساعة", "تغيير طرمبة الفرامل", "brake-pump", "الميكانيكا"},
            {"تغيير اسطوانات فرامل", "Brake Cylinder Replacement", "١-٢ ساعة", "تغيير اسطوانات الفرامل", "brake-cylinder", "الميكانيكا"},

            // الكهرباء
            {"تغيير دينمو", "Alternator Replacement", "٣٠-٤٥ دقيقة", "تغيير دينمو السيارة", "alternator", "الكهرباء"},
            {"تغيير سلف", "Starter Replacement", "٣٠-٤٥ دقيقة", "تغيير سلف السيارة", "starter", "الكهرباء"},
            {"تغيير بطارية", "Battery Replacement", "١٠-١٥ دقيقة", "تغيير بطارية السيارة", "battery", "الكهرباء"},
            {"تغيير كويل", "Ignition Coil Replacement", "٣٠-٤٥ دقيقة", "تغيير كويل الاشعال", "coil", "الكهرباء"},
            {"برمجة كمبيوتر", "ECU Programming", "١-٢ ساعة", "برمجة كمبيوتر السيارة", "ecu", "الكهرباء"},
            {"تغيير حساسات", "Sensors Replacement", "٣٠-٤٥ دقيقة", "تغيير جميع أنواع الحساسات", "sensor", "الكهرباء"},
            {"إصلاح أسواريم", "Wiring Repair", "١-٣ ساعات", "إصلاح الأسواريم الكهربائية", "wiring", "الكهرباء"},
            {"تغيير لمبات", "Bulbs Replacement", "١٥-٣٠ دقيقة", "تغيير لمبات السيارة", "bulb", "الكهرباء"},
            {"تركيب نظام صوت", "Audio System Installation", "١-٢ ساعة", "تركيب مسجل وسماعات", "audio", "الكهرباء"},
            {"تركيب إنذار", "Alarm Installation", "١-٢ ساعة", "تركيب نظام إنذار", "alarm", "الكهرباء"},

            // التكييف
            {"شحن فلور", "AC Gas Refill", "٣٠-٤٥ دقيقة", "شحن فلور المكيف", "ac-gas", "التكييف"},
            {"تغيير كمبروسر", "AC Compressor Replacement", "٢-٣ ساعات", "تغيير كمبروسر المكيف", "ac-compressor", "التكييف"},
            {"تغيير ثرمستات", "Thermostat Replacement", "٣٠-٤٥ دقيقة", "تغيير الثرمستات", "thermostat", "التكييف"},
            {"تغيير مروحة ردياتير", "Radiator Fan Replacement", "٣٠-٤٥ دقيقة", "تغيير مروحة الردياتير", "radiator-fan", "التكييف"},
            {"تغيير ردياتير", "Radiator Replacement", "١-٢ ساعة", "تغيير ردياتير الماء", "radiator", "التكييف"},
            {"تغيير طرمبة مكيف", "AC Pump Replacement", "٢-٣ ساعات", "تغيير طرمبة المكيف", "ac-pump", "التكييف"},
            {"غسيل ردياتير", "Radiator Flush", "٣٠-٤٥ دقيقة", "غسيل ردياتير المكيف", "radiator-flush", "التكييف"},
            {"تغيير مبخر", "AC Evaporator Replacement", "٢-٤ ساعات", "تغيير مبخر المكيف", "ac-evaporator", "التكييف"},

            // الإطارات
            {"تغيير إطار", "Tire Change", "١٥-٣٠ دقيقة", "تغيير إطار السيارة", "tire", "الإطارات"},
            {"ترصيص إطارات", "Tire Balancing", "٣٠-٤٥ دقيقة", "ترصيص وموازنة الإطارات", "tire-balance", "الإطارات"},
            {"وزن أذرعة", "Wheel Alignment", "٣٠-٦٠ دقيقة", "وزن أذرعة السيارة", "alignment", "الإطارات"},
            {"إصلاح بنشر", "Tire Puncture Repair", "٢٠-٤٠ دقيقة", "إصلاح ثقب الإطار", "puncture", "الإطارات"},

            // السمكرة والدهان
            {"سمكرة", "Dent Repair", "١-٣ ساعات", "سمكرة وإصلاح الصدامات", "dent", "السمكرة والدهان"},
            {"دوكو", "Painting", "١-٢ يوم", "دهان أجزاء السيارة", "paint", "السمكرة والدهان"},
            {"دهان كامل", "Full Paint Job", "٣-٥ أيام", "دهان السيارة كاملة", "full-paint", "السمكرة والدهان"},
            {"معجون", "Body Filler", "١-٢ ساعة", "معجون سمكرة", "filler", "السمكرة والدهان"},
            {"تلميع سيارات", "Car Polishing", "٢-٤ ساعات", "تلميع السيارة", "polish", "السمكرة والدهان"},
            {"إصلاح زجاج", "Glass Repair", "١-٢ ساعة", "إصلاح أو تغيير زجاج السيارة", "glass", "السمكرة والدهان"},
            {"تظليل", "Window Tinting", "٢-٣ ساعات", "تظليل زجاج السيارة", "tint", "السمكرة والدهان"},

            // الطوارئ
            {"ونش سحاب", "Tow Truck", "٣٠-٦٠ دقيقة", "خدمة الونش وسحب السيارات المتعطلة", "tow", "الطوارئ"},
            {"بنزين طوارئ", "Emergency Fuel", "١٥-٣٠ دقيقة", "توصيل بنزين للطوارئ", "fuel", "الطوارئ"},
            {"فتح باب", "Car Unlock", "١٠-٢٠ دقيقة", "فتح باب السيارة المقفول", "unlock", "الطوارئ"},
            {"شحن بطارية", "Battery Jump Start", "١٠-١٥ دقيقة", "شحن بطارية السيارة", "jump-start", "الطوارئ"},
            {"ترحيل سيارة", "Car Transport", "يعتمد على المسافة", "ترحيل السيارة", "transport", "الطوارئ"},

            // الفحص والتقييم
            {"فحص قبل الشراء", "Pre-Purchase Inspection", "١-٢ ساعة", "فحص قبل شراء السيارة", "pre-purchase", "الفحص والتقييم"},
            {"تقرير حالة السيارة", "Vehicle Condition Report", "١-٢ ساعة", "تقرير مفصل عن حالة السيارة", "condition-report", "الفحص والتقييم"},
        };

        for (Object[] t : templates) {
            String catName = (String) t[5];
            var catOpt = serviceCategoryRepository.findByNameIgnoreCase(catName);
            if (catOpt.isPresent()) {
                serviceTemplateRepository.save(ServiceTemplate.builder()
                    .name((String) t[0])
                    .nameEn((String) t[1])
                    .defaultDuration((String) t[2])
                    .description((String) t[3])
                    .icon((String) t[4])
                    .category(catOpt.get())
                    .isActive(true)
                    .build());
            }
        }
    }

    private void seedServiceTypes() {
        for (Object[] t : getServiceTypeData()) {
            ServiceType st = ServiceType.builder()
                .name((String) t[0])
                .nameEn((String) t[1])
                .icon((String) t[2])
                .description((String) t[3])
                .category((String) t[4])
                .isActive(true)
                .build();
            serviceTypeRepository.save(st);
        }
    }

    private void seedWashingServices() {
        ServiceCategory category = serviceCategoryRepository.findByNameEnIgnoreCase("bodywork")
                .orElseThrow(() -> new IllegalStateException("Bodywork category not found"));

        Object[][] washingServices = {
                {"غسيل داخلي", "Interior Car Wash", "٤٥-٦٠ دقيقة", "تنظيف وغسيل المقصورة الداخلية للسيارة", "interior-wash"},
                {"غسيل داخلي وخارجي", "Interior & Exterior Car Wash", "٦٠-٩٠ دقيقة", "غسيل كامل للسيارة من الداخل والخارج", "full-car-wash"}
        };

        for (Object[] item : washingServices) {
            serviceTemplateRepository.save(ServiceTemplate.builder()
                    .name((String) item[0]).nameEn((String) item[1])
                    .defaultDuration((String) item[2]).description((String) item[3])
                    .icon((String) item[4]).category(category).isActive(true).build());

            serviceTypeRepository.save(ServiceType.builder()
                    .name((String) item[0]).nameEn((String) item[1])
                    .icon((String) item[4]).description((String) item[3])
                    .category("bodywork").isActive(true).build());
        }
    }

    private void seedCustomer(String password) {
        Customer customer = Customer.builder()
            .name("أحمد العميل")
            .phone("0500000000")
            .email("ahmed@tasaheel.sa")
            .password(password)
            .city("الرياض")
            .isActive(true)
            .emailVerifiedAt(LocalDateTime.now())
            .build();
        customerRepository.save(customer);
    }

    private void seedWorkshops(String password) {
        Workshop w1 = Workshop.builder()
            .name("ورشة الخبراء").ownerName("أحمد محمد")
            .phone("0501111111")            .email("workshop@tasaheel.sa")
            .password(password)
            .address("الرياض - حي النهضة").city("الرياض")
            .services("صيانة دورية,مكينة,قير,كهرباء")
            .description("ورشة متخصصة في صيانة وإصلاح جميع أنواع السيارات بأحدث المعدات والتقنيات الحديثة")
            .latitude(24.7136).longitude(46.6753)
            .rating(4.5).isActive(true).isApproved(true).workshopType("stationary")
            .workingHours("[{\"day\":\"السبت\",\"open\":\"08:00\",\"close\":\"22:00\",\"closed\":false},{\"day\":\"الأحد\",\"open\":\"08:00\",\"close\":\"22:00\",\"closed\":false},{\"day\":\"الاثنين\",\"open\":\"08:00\",\"close\":\"22:00\",\"closed\":false},{\"day\":\"الثلاثاء\",\"open\":\"08:00\",\"close\":\"22:00\",\"closed\":false},{\"day\":\"الأربعاء\",\"open\":\"08:00\",\"close\":\"22:00\",\"closed\":false},{\"day\":\"الخميس\",\"open\":\"08:00\",\"close\":\"22:00\",\"closed\":false},{\"day\":\"الجمعة\",\"open\":\"00:00\",\"close\":\"00:00\",\"closed\":true}]")
            .whatsapp("966501111111")
            .features("waiting_area,warranty,original_parts,parking")
            .build();

        Workshop w2 = Workshop.builder()
            .name("ورشة التقنية").ownerName("خالد عبدالله")
            .phone("0502222222").email("tech@tasaheel.sa")
            .password(password)
            .address("جدة - حي السلامة").city("جدة")
            .services("سمكرة,دهان,تكييف,كهرباء")
            .description("ورشة متخصصة في السمكرة والدهان والتكييف بجودة عالية وأسعار مناسبة")
            .latitude(21.5433).longitude(39.1728)
            .rating(4.2).isActive(true).isApproved(true).workshopType("stationary")
            .workingHours("[{\"day\":\"السبت\",\"open\":\"09:00\",\"close\":\"23:00\",\"closed\":false},{\"day\":\"الأحد\",\"open\":\"09:00\",\"close\":\"23:00\",\"closed\":false},{\"day\":\"الاثنين\",\"open\":\"09:00\",\"close\":\"23:00\",\"closed\":false},{\"day\":\"الثلاثاء\",\"open\":\"09:00\",\"close\":\"23:00\",\"closed\":false},{\"day\":\"الأربعاء\",\"open\":\"09:00\",\"close\":\"23:00\",\"closed\":false},{\"day\":\"الخميس\",\"open\":\"09:00\",\"close\":\"23:00\",\"closed\":false},{\"day\":\"الجمعة\",\"open\":\"13:00\",\"close\":\"23:00\",\"closed\":false}]")
            .whatsapp("966502222222")
            .features("waiting_area,coffee,parking,car_wash")
            .build();

        Workshop w3 = Workshop.builder()
            .name("ورشة المتقن").ownerName("سامي علي")
            .phone("0503333333").email("master@tasaheel.sa")
            .password(password)
            .address("الدمام - حي العدامة").city("الدمام")
            .services("صيانة دورية,مكينة,قير")
            .description("ورشة متخصصة في الصيانة الدورية والعمرة الشاملة للمحركات والقير")
            .latitude(26.4207).longitude(50.0888)
            .rating(4.8).isActive(true).isApproved(true).workshopType("stationary")
            .workingHours("[{\"day\":\"السبت\",\"open\":\"07:00\",\"close\":\"21:00\",\"closed\":false},{\"day\":\"الأحد\",\"open\":\"07:00\",\"close\":\"21:00\",\"closed\":false},{\"day\":\"الاثنين\",\"open\":\"07:00\",\"close\":\"21:00\",\"closed\":false},{\"day\":\"الثلاثاء\",\"open\":\"07:00\",\"close\":\"21:00\",\"closed\":false},{\"day\":\"الأربعاء\",\"open\":\"07:00\",\"close\":\"21:00\",\"closed\":false},{\"day\":\"الخميس\",\"open\":\"07:00\",\"close\":\"21:00\",\"closed\":false},{\"day\":\"الجمعة\",\"open\":\"00:00\",\"close\":\"00:00\",\"closed\":true}]")
            .providesPickupDelivery(true)
            .whatsapp("966503333333")
            .features("waiting_area,warranty,original_parts,parking,pickup_delivery")
            .build();

        Workshop w4 = Workshop.builder()
            .name("ورشة الصيانة السريعة").ownerName("فهد عمر")
            .phone("0504444444").email("quick@tasaheel.sa")
            .password(password)
            .address("مكة - حي العزيزية").city("مكة")
            .services("صيانة دورية,كهرباء,تكييف")
            .description("خدمة صيانة سريعة ومتنقلة لمختلف أنحاء المدينة")
            .latitude(21.3891).longitude(39.8579)
            .rating(4.0).isActive(true).isApproved(true).workshopType("mobile")
            .workingHours("[{\"day\":\"السبت\",\"open\":\"08:00\",\"close\":\"22:00\",\"closed\":false},{\"day\":\"الأحد\",\"open\":\"08:00\",\"close\":\"22:00\",\"closed\":false},{\"day\":\"الاثنين\",\"open\":\"08:00\",\"close\":\"22:00\",\"closed\":false},{\"day\":\"الثلاثاء\",\"open\":\"08:00\",\"close\":\"22:00\",\"closed\":false},{\"day\":\"الأربعاء\",\"open\":\"08:00\",\"close\":\"22:00\",\"closed\":false},{\"day\":\"الخميس\",\"open\":\"08:00\",\"close\":\"22:00\",\"closed\":false},{\"day\":\"الجمعة\",\"open\":\"13:00\",\"close\":\"22:00\",\"closed\":false}]")
            .whatsapp("966504444444")
            .features("pickup_delivery")
            .build();

        Workshop w5 = Workshop.builder()
            .name("ورشة الإتقان").ownerName("ناصر حسن")
            .phone("0505555555").email("itqan@tasaheel.sa")
            .password(password)
            .address("المدينة - حي العوالي").city("المدينة المنورة")
            .services("سمكرة,دهان,ونش سحاب")
            .description("ورشة متخصصة في السمكرة والدهان وخدمة الونش والسحب")
            .latitude(24.4672).longitude(39.6024)
            .rating(4.6).isActive(true).isApproved(true).workshopType("stationary")
            .workingHours("[{\"day\":\"السبت\",\"open\":\"08:00\",\"close\":\"00:00\",\"closed\":false},{\"day\":\"الأحد\",\"open\":\"08:00\",\"close\":\"00:00\",\"closed\":false},{\"day\":\"الاثنين\",\"open\":\"08:00\",\"close\":\"00:00\",\"closed\":false},{\"day\":\"الثلاثاء\",\"open\":\"08:00\",\"close\":\"00:00\",\"closed\":false},{\"day\":\"الأربعاء\",\"open\":\"08:00\",\"close\":\"00:00\",\"closed\":false},{\"day\":\"الخميس\",\"open\":\"08:00\",\"close\":\"00:00\",\"closed\":false},{\"day\":\"الجمعة\",\"open\":\"08:00\",\"close\":\"00:00\",\"closed\":false}]")
            .providesPickupDelivery(true)
            .whatsapp("966505555555")
            .features("waiting_area,coffee,parking,pickup_delivery")
            .build();

        workshopRepository.save(w1);
        workshopRepository.save(w2);
        workshopRepository.save(w3);
        workshopRepository.save(w4);
        workshopRepository.save(w5);
    }

    private void seedWorkshopServices() {
        var allTypes = serviceTypeRepository.findAll();

        // Workshop 1: الخبراء — صيانة دورية,مكينة,قير,كهرباء
        // Using findByName to match services
        addService(1, "تغيير زيت المحرك", 150.0);
        addService(1, "تغيير فلتر الهواء", 80.0);
        addService(1, "فحص دوري شامل", 200.0);
        addService(1, "عمرة مكينة", 3000.0);
        addService(1, "تغيير وجه سلندر", 1500.0);
        addService(1, "إصلاح تسريبات زيت", 200.0);
        addService(1, "عمرة قير أوتوماتيك", 2500.0);
        addService(1, "تغيير زيت الدفرنس", 150.0);
        addService(1, "تغيير دينمو", 350.0);
        addService(1, "تغيير سلف", 250.0);
        addService(1, "تغيير بطارية", 200.0);

        // Workshop 2: التقنية — سمكرة,دهان,تكييف,كهرباء
        addService(2, "سمكرة", 500.0);
        addService(2, "دوكو", 800.0);
        addService(2, "دهان كامل", 3000.0);
        addService(2, "تلميع سيارات", 400.0);
        addService(2, "شحن فلور", 150.0);
        addService(2, "تغيير كمبروسر", 1200.0);
        addService(2, "تغيير طرمبة مكيف", 800.0);
        addService(2, "تغيير دينمو", 400.0);
        addService(2, "تغيير بطارية", 200.0);
        addService(2, "برمجة كمبيوتر", 500.0);

        // Workshop 3: المتقن — صيانة دورية,مكينة,قير
        addService(3, "تغيير زيت المحرك", 120.0);
        addService(3, "تغيير فلتر المكيف", 70.0);
        addService(3, "فحص دوري شامل", 180.0);
        addService(3, "عمرة مكينة", 2800.0);
        addService(3, "تغيير طرمبة الزيت", 300.0);
        addService(3, "عمرة قير أوتوماتيك", 2200.0);
        addService(3, "تغيير كلتش", 600.0);
        addService(3, "تغيير زيت الدفرنس", 120.0);

        // Workshop 4: الصيانة السريعة — صيانة دورية,كهرباء,تكييف
        addService(4, "تغيير زيت المحرك", 100.0);
        addService(4, "تغيير زيت القير", 120.0);
        addService(4, "تغيير سلف", 200.0);
        addService(4, "تغيير بطارية", 150.0);
        addService(4, "تغيير لمبات", 50.0);
        addService(4, "شحن فلور", 120.0);
        addService(4, "تغيير ثرمستات", 100.0);

        // Workshop 5: الإتقان — سمكرة,دهان,ونش سحاب
        addService(5, "سمكرة", 600.0);
        addService(5, "دوكو", 900.0);
        addService(5, "دهان كامل", 3500.0);
        addService(5, "إصلاح زجاج", 300.0);
        addService(5, "تظليل", 500.0);
        addService(5, "ونش سحاب", 200.0);
    }

    private void addService(long workshopId, String serviceName, double price) {
        var workshopOpt = workshopRepository.findById(workshopId);
        var serviceOpt = serviceTypeRepository.findByName(serviceName);
        if (workshopOpt.isPresent() && serviceOpt.isPresent()) {
            var existing = workshopServiceRepository.findByWorkshopIdAndServiceTypeId(workshopId, serviceOpt.get().getId());
            if (existing.isEmpty()) {
                workshopServiceRepository.save(WorkshopService.builder()
                        .workshop(workshopOpt.get())
                        .serviceType(serviceOpt.get())
                        .price(price)
                        .build());
            }
        }
    }

    private void seedWorkshopServiceListings() {
        var w1Opt = workshopRepository.findById(1L);
        if (w1Opt.isEmpty()) return;
        var w1 = w1Opt.get();

        var catPeriodic = serviceCategoryRepository.findByNameIgnoreCase("الصيانة الدورية").orElse(null);
        var catMechanical = serviceCategoryRepository.findByNameIgnoreCase("الميكانيكا").orElse(null);
        var catElectrical = serviceCategoryRepository.findByNameIgnoreCase("الكهرباء").orElse(null);

        Object[][] listings = {
            {"تغيير زيت المحرك", "تغيير زيت المحرك مع فلتر الزيت", 150.0, "fixed", "٢٠-٣٠ دقيقة", catPeriodic},
            {"تغيير فلتر الهواء", "تغيير فلتر هواء المحرك", 80.0, "fixed", "١٠-١٥ دقيقة", catPeriodic},
            {"فحص دوري شامل", "فحص شامل للسيارة", 200.0, "starting", "٤٥-٦٠ دقيقة", catPeriodic},
            {"تغيير شمعات الاحتراق", "تغيير بوجيات المحرك", 250.0, "fixed", "٣٠-٤٥ دقيقة", catPeriodic},
            {"تغيير زيت القير", "تغيير زيت ناقل الحركة", 300.0, "fixed", "٣٠-٤٥ دقيقة", catPeriodic},
            {"تغيير سير المكينة", "تغيير سير المكينة", 350.0, "fixed", "٣٠-٤٥ دقيقة", catPeriodic},
            {"عمرة مكينة", "عمرة كاملة للمحرك", 3000.0, "starting", "٣-٥ أيام", catMechanical},
            {"تغيير وجه سلندر", "تغيير وجه السلندر", 1500.0, "starting", "٢-٣ أيام", catMechanical},
            {"إصلاح تسريبات زيت", "إصلاح تسريبات زيت المحرك", 200.0, "negotiable", "١-٢ ساعة", catMechanical},
            {"عمرة قير أوتوماتيك", "عمرة قير أوتوماتيك", 2500.0, "starting", "٢-٤ أيام", catMechanical},
            {"تغيير كلتش", "تغيير طقم الكلتش", 600.0, "fixed", "٣-٦ ساعات", catMechanical},
            {"تغيير مساعدات", "تغيير المساعدات الأمامية والخلفية", 400.0, "fixed", "١-٢ ساعة", catMechanical},
            {"تغيير دينمو", "تغيير دينمو السيارة", 350.0, "fixed", "٣٠-٤٥ دقيقة", catElectrical},
            {"تغيير سلف", "تغيير سلف السيارة", 250.0, "fixed", "٣٠-٤٥ دقيقة", catElectrical},
            {"تغيير بطارية", "تغيير بطارية السيارة", 200.0, "fixed", "١٠-١٥ دقيقة", catElectrical},
        };

        int order = 0;
        for (Object[] l : listings) {
            var templateOpt = serviceTemplateRepository.findAll().stream()
                    .filter(t -> t.getName().equals(l[0]))
                    .findFirst();
            workshopServiceListingRepository.save(WorkshopServiceListing.builder()
                .workshop(w1)
                .serviceTemplate(templateOpt.orElse(null))
                .name((String) l[0])
                .description((String) l[1])
                .price((Double) l[2])
                .priceType((String) l[3])
                .estimatedDuration((String) l[4])
                .category((ServiceCategory) l[5])
                .isVisible(true)
                .isAvailable(true)
                .displayOrder(order++)
                .isDeleted(false)
                .build());
        }
    }
}
