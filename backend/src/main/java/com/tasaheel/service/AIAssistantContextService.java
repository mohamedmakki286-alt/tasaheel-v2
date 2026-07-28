package com.tasaheel.service;

import com.tasaheel.entity.*;
import com.tasaheel.repository.*;
import com.tasaheel.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AIAssistantContextService {
    private final CustomerRepository customerRepository;
    private final CustomerCarRepository customerCarRepository;
    private final MaintenanceRequestRepository requestRepository;
    private final InvoiceRepository invoiceRepository;
    private final WorkshopRepository workshopRepository;

    @Transactional(readOnly = true)
    public String buildContext(UserDetailsImpl user) {
        if (user == null) {
            return "المستخدم زائر غير مسجل. لا تعرض بيانات شخصية واطلب تسجيل الدخول للأسئلة المتعلقة بالطلبات والسيارات والفواتير.";
        }
        if (!"customer".equalsIgnoreCase(user.getRole())) {
            return "المستخدم مسجل بدور " + user.getRole() + "، ولا يُسمح بعرض بيانات عميل من هذه الواجهة.";
        }
        Customer customer = customerRepository.findById(user.getUserId()).orElse(null);
        if (customer == null) return "تعذر العثور على ملف العميل المسجل.";

        StringBuilder out = new StringBuilder("بيانات مؤكدة من تساهيل:\n");
        out.append("العميل: ").append(customer.getName())
                .append(". المدينة: ").append(value(customer.getCity(), "غير محددة")).append(".\n");

        List<CustomerCar> cars = customerCarRepository.findByCustomerId(customer.getId());
        out.append("السيارات: ").append(cars.isEmpty() ? "لا توجد سيارات مسجلة"
                : cars.stream().limit(5).map(this::carSummary).toList()).append(".\n");

        List<MaintenanceRequest> requests = requestRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId());
        if (requests.isEmpty()) {
            out.append("الطلبات: لا توجد طلبات سابقة.\n");
        } else {
            MaintenanceRequest latest = requests.get(0);
            out.append("آخر طلب: رقم ").append(latest.getId())
                    .append("، الحالة ").append(statusAr(latest.getStatus()))
                    .append("، السيارة ").append(carSummary(latest.getCar()))
                    .append("، أُنشئ في ").append(latest.getCreatedAt()).append(".\n")
                    .append("عدد الطلبات: ").append(requests.size()).append(".\n");
        }

        List<Invoice> invoices = invoiceRepository.findByCustomerId(customer.getId(), PageRequest.of(0, 3)).getContent();
        if (invoices.isEmpty()) {
            out.append("الفواتير: لا توجد فواتير.\n");
        } else {
            Invoice invoice = invoices.get(0);
            out.append("آخر فاتورة: رقم ").append(invoice.getInvoiceNumber())
                    .append("، الحالة ").append(statusAr(invoice.getStatus()))
                    .append("، الإجمالي ").append(invoice.getGrandTotal() == null ? "غير محدد" : invoice.getGrandTotal() + " ريال")
                    .append("، للطلب رقم ").append(invoice.getRequest().getId()).append(".\n");
        }

        List<Workshop> workshops = customer.getCity() == null ? List.of()
                : workshopRepository.findByCityAndIsApprovedAndIsActive(customer.getCity(), true, true);
        workshops.sort(Comparator.comparing(Workshop::getRating, Comparator.nullsLast(Comparator.reverseOrder())));
        if (workshops.isEmpty()) {
            out.append("الورش النشطة المعتمدة في مدينة العميل: لا توجد نتائج حالياً.");
        } else {
            out.append("ورش نشطة معتمدة في مدينة العميل: ")
                    .append(workshops.stream().limit(5)
                            .map(w -> w.getName() + " (التقييم " + value(w.getRating(), 0.0)
                                    + "، العنوان " + value(w.getAddress(), "غير محدد") + ")").toList())
                    .append(". لا تقل إنها مرتبة حسب المسافة لأن إحداثيات العميل غير محفوظة.");
        }
        return out.toString();
    }

    private String carSummary(CustomerCar car) {
        if (car == null) return "غير محددة";
        return value(car.getMake(), "") + " " + value(car.getModel(), "") + " " + value(car.getYear(), "");
    }

    private String statusAr(String status) {
        if (status == null) return "غير محددة";
        return switch (status.toLowerCase(Locale.ROOT)) {
            case "draft" -> "مسودة";
            case "pending", "submitted" -> "بانتظار عروض الورش";
            case "quoted" -> "وصل عرض سعر";
            case "accepted" -> "مقبول";
            case "in_progress" -> "قيد التنفيذ";
            case "inspection_completed" -> "اكتمل الفحص";
            case "completed" -> "مكتمل";
            case "cancelled", "canceled" -> "ملغي";
            case "rejected" -> "مرفوض";
            case "paid" -> "مدفوعة";
            case "unpaid", "pending_payment" -> "بانتظار الدفع";
            default -> status;
        };
    }

    private <T> T value(T current, T fallback) {
        return current == null ? fallback : current;
    }
}
