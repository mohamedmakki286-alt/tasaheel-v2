package com.tasaheel.event;

import com.tasaheel.entity.Customer;
import com.tasaheel.entity.MaintenanceRequest;
import com.tasaheel.entity.Technician;
import com.tasaheel.entity.Workshop;
import com.tasaheel.integration.FirebaseService;
import com.tasaheel.repository.MaintenanceRequestRepository;
import com.tasaheel.repository.TechnicianRepository;
import com.tasaheel.repository.WorkshopRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class FcmEventHandler {

    private final FirebaseService firebaseService;
    private final MaintenanceRequestRepository requestRepository;
    private final WorkshopRepository workshopRepository;
    private final TechnicianRepository technicianRepository;

    @EventListener
    public void handleDomainEvent(DomainEvent event) {
        if (event.getRequestId() == null) return;

        MaintenanceRequest request = requestRepository.findById(event.getRequestId()).orElse(null);
        if (request == null) return;

        String title = titleFor(event.getEventType());
        String body = bodyFor(event.getEventType(), request, event.getPayload());
        Map<String, String> data = new HashMap<>();
        data.put("type", event.getEventType().name());
        data.put("eventType", event.getEventType().name());
        data.put("requestId", String.valueOf(event.getRequestId()));
        data.put("timestamp", event.getEventTimestamp().toString());

        String actorRole = normalizeRole(event.getActorRole());
        Customer customer = request.getCustomer();
        if (!"customer".equals(actorRole) && customer != null) {
            send(customer.getFcmToken(), title, body, data);
        }

        if (!"workshop".equals(actorRole)) {
            for (Long workshopId : targetWorkshopIds(request, event)) {
                workshopRepository.findById(workshopId)
                        .ifPresent(workshop -> send(workshop.getFcmToken(), title, body, data));
            }
        }

        Long technicianId = extractLong(event.getPayload(), "technicianId");
        if (technicianId == null && request.getTechnician() != null) {
            technicianId = request.getTechnician().getId();
        }
        if (technicianId != null && !"technician".equals(actorRole)) {
            Technician technician = technicianRepository.findById(technicianId).orElse(null);
            if (technician != null) {
                String technicianTitle = event.getEventType() == EventType.WORKSHOP_ASSIGNED
                        ? "تم إسناد مهمة جديدة" : title;
                String technicianBody = event.getEventType() == EventType.WORKSHOP_ASSIGNED
                        ? "تم إسناد طلب جديد إليك" : body;
                send(technician.getFcmToken(), technicianTitle, technicianBody, data);
            }
        }
    }

    private List<Long> targetWorkshopIds(MaintenanceRequest request, DomainEvent event) {
        Set<Long> ids = new LinkedHashSet<>();
        Long payloadWorkshopId = extractLong(event.getPayload(), "workshopId");
        if (payloadWorkshopId != null) ids.add(payloadWorkshopId);

        if (event.getEventType() == EventType.REQUEST_SUBMITTED
                && request.getCity() != null && !request.getCity().isBlank()) {
            workshopRepository.findByCityAndIsApprovedAndIsActive(request.getCity(), true, true)
                    .stream().map(Workshop::getId).forEach(ids::add);
        }
        return List.copyOf(ids);
    }

    private void send(String token, String title, String body, Map<String, String> data) {
        if (token != null && !token.isBlank()) {
            firebaseService.sendNotification(token, title, body, data);
        }
    }

    private Long extractLong(Map<String, Object> payload, String key) {
        if (payload == null) return null;
        Object value = payload.get(key);
        if (value instanceof Number number) return number.longValue();
        if (value instanceof String text) {
            try {
                return Long.parseLong(text);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private String normalizeRole(String role) {
        return role == null ? "" : role.trim().toLowerCase();
    }

    private String titleFor(EventType type) {
        return switch (type) {
            case REQUEST_CREATED, REQUEST_SUBMITTED -> "طلب جديد";
            case QUOTE_GENERATED -> "عرض سعر جديد";
            case QUOTE_ACCEPTED, OFFER_ACCEPTED, OFFER_SELECTED -> "تم قبول العرض";
            case QUOTE_REJECTED -> "تم رفض العرض";
            case WORKSHOP_ASSIGNED, WORKSHOP_REASSIGNED -> "تم إسناد الطلب";
            case STATUS_UPDATED -> "تحديث حالة الطلب";
            case SERVICE_STARTED -> "بدأت الخدمة";
            case SERVICE_COMPLETED, SERVICE_VERIFIED -> "اكتملت الخدمة";
            case REPORT_SUBMITTED -> "تقرير الفحص";
            case REPORT_APPROVED -> "تم اعتماد التقرير";
            case REPORT_REJECTED -> "تم رفض التقرير";
            case INVOICE_CREATED, INVOICE_APPROVED -> "تحديث الفاتورة";
            case PAYMENT_INITIATED -> "بدأت عملية الدفع";
            case PAYMENT_HELD -> "تم تأكيد الدفع";
            case PAYMENT_RELEASED -> "تم صرف الدفعة";
            case PAYMENT_REFUNDED -> "تم استرداد الدفعة";
            case REQUEST_CANCELLED -> "تم إلغاء الطلب";
            case ADMIN_OVERRIDE -> "تحديث من إدارة تساهيل";
            default -> "إشعار من تساهيل";
        };
    }

    private String bodyFor(EventType type, MaintenanceRequest request, Map<String, Object> payload) {
        String serviceName = request.getServiceTypes() == null || request.getServiceTypes().isEmpty()
                ? "" : request.getServiceTypes().get(0).getName();
        return switch (type) {
            case REQUEST_CREATED -> "تم إنشاء طلب خدمة " + serviceName;
            case REQUEST_SUBMITTED -> "طلب خدمة جديد في مدينتك: " + serviceName;
            case QUOTE_GENERATED -> "وصل عرض سعر جديد لطلب " + serviceName;
            case QUOTE_ACCEPTED, OFFER_ACCEPTED, OFFER_SELECTED -> "تم قبول العرض لطلب " + serviceName;
            case QUOTE_REJECTED -> "تم رفض العرض لطلب " + serviceName;
            case WORKSHOP_ASSIGNED, WORKSHOP_REASSIGNED -> "تم إسناد طلب " + serviceName;
            case STATUS_UPDATED -> "تغيرت حالة الطلب إلى: " + String.valueOf(payload == null ? "" : payload.getOrDefault("status", ""));
            case SERVICE_STARTED -> "بدأ العمل على الخدمة " + serviceName;
            case SERVICE_COMPLETED, SERVICE_VERIFIED -> "اكتملت الخدمة " + serviceName;
            case REPORT_SUBMITTED -> "تم إرسال تقرير الفحص";
            case REPORT_APPROVED -> "تم اعتماد تقرير الفحص";
            case REPORT_REJECTED -> "تم رفض تقرير الفحص";
            case INVOICE_CREATED, INVOICE_APPROVED -> "يوجد تحديث جديد على فاتورة الطلب";
            case PAYMENT_INITIATED -> "بدأت عملية الدفع للطلب";
            case PAYMENT_HELD -> "تم تأكيد دفع قيمة الطلب";
            case PAYMENT_RELEASED -> "تم صرف مستحقات الطلب";
            case PAYMENT_REFUNDED -> "تم استرداد قيمة الطلب";
            case ADMIN_OVERRIDE -> "قامت الإدارة بتحديث الطلب";
            case REQUEST_CANCELLED -> "تم إلغاء الطلب";
            default -> "يوجد تحديث جديد على الطلب";
        };
    }
}
