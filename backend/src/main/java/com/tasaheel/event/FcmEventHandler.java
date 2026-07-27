package com.tasaheel.event;

import com.tasaheel.entity.Customer;
import com.tasaheel.entity.MaintenanceRequest;
import com.tasaheel.entity.Workshop;
import com.tasaheel.entity.Technician;
import com.tasaheel.integration.FirebaseService;
import com.tasaheel.repository.CustomerRepository;
import com.tasaheel.repository.MaintenanceRequestRepository;
import com.tasaheel.repository.WorkshopRepository;
import com.tasaheel.repository.TechnicianRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class FcmEventHandler {

    private final FirebaseService firebaseService;
    private final MaintenanceRequestRepository requestRepository;
    private final CustomerRepository customerRepository;
    private final WorkshopRepository workshopRepository;
    private final TechnicianRepository technicianRepository;

    @EventListener
    public void handleDomainEvent(DomainEvent event) {
        if (event.getRequestId() == null) return;

        MaintenanceRequest request = requestRepository.findById(event.getRequestId()).orElse(null);
        if (request == null) return;

        String title = getTitle(event.getEventType());
        String body = getBody(event.getEventType(), request, event.getPayload());

        Map<String, String> data = new HashMap<>();
        data.put("type", event.getEventType().name());
        data.put("requestId", String.valueOf(event.getRequestId()));
        data.put("timestamp", event.getEventTimestamp().toString());

        String actorRole = event.getActorRole() == null ? "" : event.getActorRole().trim().toLowerCase();
        Customer customer = request.getCustomer();
        if (!"customer".equals(actorRole)
                && customer != null
                && customer.getFcmToken() != null
                && !customer.getFcmToken().isBlank()) {
            firebaseService.sendNotification(customer.getFcmToken(), title, body, data);
        }

        if (!"workshop".equals(actorRole)) {
            for (Long workshopId : extractWorkshopIds(request, event)) {
                Workshop workshop = workshopRepository.findById(workshopId).orElse(null);
                if (workshop != null && workshop.getFcmToken() != null && !workshop.getFcmToken().isBlank()) {
                    firebaseService.sendNotification(workshop.getFcmToken(), title, body, data);
                }
            }
        }

        Object technicianValue = event.getPayload() == null ? null : event.getPayload().get("technicianId");
        Long technicianId = null;
        if (technicianValue instanceof Number) {
            technicianId = ((Number) technicianValue).longValue();
        } else if (request.getTechnician() != null) {
            technicianId = request.getTechnician().getId();
        }
        if (technicianId != null && !"technician".equals(actorRole)) {
            Technician technician = technicianRepository.findById(technicianId).orElse(null);
            if (technician != null && technician.getFcmToken() != null && !technician.getFcmToken().isBlank()) {
                firebaseService.sendNotification(technician.getFcmToken(), "تم إسناد مهمة جديدة",
                        "تم إسناد طلب جديد إليك", data);
            }
        }
    }

    private java.util.List<Long> extractWorkshopIds(MaintenanceRequest request, DomainEvent event) {
        if (event.getPayload() != null && event.getPayload().containsKey("workshopId")) {
            Object val = event.getPayload().get("workshopId");
            if (val instanceof Number) {
                return java.util.List.of(((Number) val).longValue());
            }
        }
        if ("workshop".equals(event.getActorRole()) && event.getActorId() != null) {
            return java.util.List.of(event.getActorId());
        }
        return java.util.Collections.emptyList();
    }

    private String getTitle(EventType type) {
        return switch (type) {
            case REQUEST_CREATED, REQUEST_SUBMITTED -> "طلب جديد";
            case QUOTE_GENERATED -> "عرض سعر جديد";
            case OFFER_ACCEPTED -> "تم قبول العرض";
            case QUOTE_REJECTED -> "تم رفض عرضك";
            case STATUS_UPDATED -> "تحديث حالة الطلب";
            case SERVICE_STARTED -> "بدأت الخدمة";
            case SERVICE_COMPLETED -> "اكتملت الخدمة";
            case REPORT_SUBMITTED -> "تقرير الفحص";
            case REPORT_APPROVED -> "تم اعتماد التقرير";
            case INVOICE_CREATED -> "فاتورة جديدة";
            case PAYMENT_HELD -> "تم حجز الدفعة";
            case PAYMENT_RELEASED -> "تم صرف الدفعة";
            case ADMIN_OVERRIDE -> "تحديث من إدارة النظام";
            default -> "إشعار من تساهيل";
        };
    }

    private String getBody(EventType type, MaintenanceRequest request, Map<String, Object> payload) {
        String serviceName = !request.getServiceTypes().isEmpty() ? request.getServiceTypes().get(0).getName() : "";
        return switch (type) {
            case REQUEST_CREATED -> "تم إنشاء طلب خدمة " + serviceName;
            case REQUEST_SUBMITTED -> "تم تقديم طلب " + serviceName;
            case QUOTE_GENERATED -> "تم استلام عرض سعر لطلب " + serviceName;
            case OFFER_ACCEPTED -> "تم قبول العرض لطلب " + serviceName;
            case QUOTE_REJECTED -> "تم رفض عرضك لطلب " + serviceName + " - تم اختيار عرض ورشة أخرى";
            case STATUS_UPDATED -> "تغيرت حالة الطلب: " + getStatusLabel(payload);
            case SERVICE_STARTED -> "بدأ العمل على الخدمة: " + getServiceLabel(payload);
            case SERVICE_COMPLETED -> "اكتملت الخدمة: " + getServiceLabel(payload);
            case REPORT_SUBMITTED -> "تم تقديم تقرير الفحص للطلب";
            case REPORT_APPROVED -> "تم اعتماد تقرير الفحص";
            case INVOICE_CREATED -> "تم إصدار فاتورة للطلب";
            case PAYMENT_HELD -> "تم حجز المبلغ لحين اكتمال الخدمة";
            case PAYMENT_RELEASED -> "تم صرف المبلغ للورشة";
            case ADMIN_OVERRIDE -> "قامت الإدارة بتحديث الطلب";
            case REQUEST_CANCELLED -> "تم إلغاء الطلب";
            default -> "هناك تحديث جديد على طلبك";
        };
    }

    private String getStatusLabel(Map<String, Object> payload) {
        if (payload != null && payload.containsKey("status")) {
            return payload.get("status").toString();
        }
        return "";
    }

    private String getServiceLabel(Map<String, Object> payload) {
        if (payload != null && payload.containsKey("serviceItemId")) {
            return "رقم " + payload.get("serviceItemId");
        }
        return "";
    }
}
