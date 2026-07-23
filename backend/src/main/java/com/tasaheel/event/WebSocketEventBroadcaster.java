package com.tasaheel.event;

import com.tasaheel.entity.Customer;
import com.tasaheel.entity.MaintenanceRequest;
import com.tasaheel.entity.Workshop;
import com.tasaheel.repository.CustomerRepository;
import com.tasaheel.repository.MaintenanceRequestRepository;
import com.tasaheel.repository.WorkshopRepository;
import com.tasaheel.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventBroadcaster {

    private final SimpMessagingTemplate messagingTemplate;
    private final MaintenanceRequestRepository requestRepository;
    private final CustomerRepository customerRepository;
    private final WorkshopRepository workshopRepository;
    private final NotificationService notificationService;

    @EventListener
    public void handleDomainEvent(DomainEvent event) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", event.getEventType().name());
            message.put("requestId", event.getRequestId());
            message.put("actorRole", event.getActorRole());
            message.put("actorId", event.getActorId());
            message.put("payload", event.getPayload());
            message.put("timestamp", event.getEventTimestamp().toString());

            // Broadcast to request-specific topic
            if (event.getRequestId() != null) {
                String topic = "/topic/request/" + event.getRequestId();
                messagingTemplate.convertAndSend(topic, message);

                String statusTopic = "/topic/request/" + event.getRequestId() + "/" + event.getEventType().name().toLowerCase();
                messagingTemplate.convertAndSend(statusTopic, message);
            }

            // Broadcast to workshop-specific topic
            Long workshopId = null;
            if (event.getPayload() != null) {
                Object pid = event.getPayload().get("workshopId");
                if (pid instanceof Number) workshopId = ((Number) pid).longValue();
            }
            if (workshopId == null && "workshop".equals(event.getActorRole())) {
                workshopId = event.getActorId();
            }
            if (workshopId != null) {
                messagingTemplate.convertAndSend("/topic/workshop/" + workshopId, message);
            }

            // Broadcast to customer-specific topic
            Long customerId = null;
            if (event.getPayload() != null) {
                Object cid = event.getPayload().get("customerId");
                if (cid instanceof Number) customerId = ((Number) cid).longValue();
            }
            if (customerId == null && "customer".equals(event.getActorRole())) {
                customerId = event.getActorId();
            }
            if (customerId == null && event.getRequestId() != null) {
                MaintenanceRequest request = requestRepository.findById(event.getRequestId()).orElse(null);
                if (request != null && request.getCustomer() != null) {
                    customerId = request.getCustomer().getId();
                }
            }
            if (customerId != null) {
                messagingTemplate.convertAndSend("/topic/customer/" + customerId, message);
            }

            // Broadcast to city-specific topic for new requests
            if (event.getPayload() != null && event.getPayload().get("city") != null) {
                messagingTemplate.convertAndSend("/topic/city/" + event.getPayload().get("city"), message);
            }

            // Broadcast to admin topic
            messagingTemplate.convertAndSend("/topic/admin", message);

            // Persist notifications for affected users
            persistNotifications(event, customerId, workshopId);

            log.debug("Broadcast event {} for request {}", event.getEventType(), event.getRequestId());
        } catch (Exception e) {
            log.error("Failed to broadcast event {}: {}", event.getEventType(), e.getMessage());
        }
    }

    private void persistNotifications(DomainEvent event, Long customerId, Long workshopId) {
        if (event.getRequestId() == null) return;

        MaintenanceRequest request = requestRepository.findById(event.getRequestId()).orElse(null);
        if (request == null) return;

        String title = getTitle(event.getEventType());
        String body = getBody(event.getEventType(), request);
        String eventType = event.getEventType().name();

        // Notify customer
        if (customerId != null && !"customer".equals(event.getActorRole())) {
            try {
                notificationService.save(customerId, "customer", eventType, title, body,
                        event.getRequestId(), eventType);
            } catch (Exception e) {
                log.warn("Failed to save notification for customer {}: {}", customerId, e.getMessage());
            }
        }

        // Notify workshop(s)
        if (workshopId != null && !"workshop".equals(event.getActorRole())) {
            try {
                notificationService.save(workshopId, "workshop", eventType, title, body,
                        event.getRequestId(), eventType);
            } catch (Exception e) {
                log.warn("Failed to save notification for workshop {}: {}", workshopId, e.getMessage());
            }
        }

        // Notify admin
        try {
            notificationService.save(0L, "admin", eventType, title, body,
                    event.getRequestId(), eventType);
        } catch (Exception e) {
            log.warn("Failed to save notification for admin: {}", e.getMessage());
        }
    }

    private String getTitle(EventType type) {
        return switch (type) {
            case REQUEST_CREATED, REQUEST_SUBMITTED -> "طلب جديد";
            case QUOTE_GENERATED -> "عرض سعر جديد";
            case OFFER_ACCEPTED -> "تم قبول العرض";
            case QUOTE_REJECTED -> "تم رفض عرضك";
            case STATUS_UPDATED -> "تحديث الحالة";
            case SERVICE_STARTED -> "بدء الخدمة";
            case SERVICE_COMPLETED -> "اكتملت الخدمة";
            case REPORT_SUBMITTED -> "تقرير الفحص";
            case REPORT_APPROVED -> "تم اعتماد التقرير";
            case INVOICE_CREATED -> "فاتورة جديدة";
            case PAYMENT_HELD -> "تم حجز الدفع";
            case PAYMENT_RELEASED -> "تم صرف الدفع";
            case ADMIN_OVERRIDE -> "مدير النظام قام بتحديث الطلب";
            case REQUEST_CANCELLED -> "تم إلغاء الطلب";
            default -> "إشعار";
        };
    }

    private String getBody(EventType type, MaintenanceRequest request) {
        String serviceName = "";
        if (request.getServiceTypes() != null && !request.getServiceTypes().isEmpty()) {
            serviceName = request.getServiceTypes().get(0).getName();
        }
        return switch (type) {
            case REQUEST_CREATED -> "تم إنشاء طلب خدمة " + serviceName;
            case REQUEST_SUBMITTED -> "تم تقديم طلب " + serviceName;
            case QUOTE_GENERATED -> "تم استلام عرض سعر لطلب " + serviceName;
            case OFFER_ACCEPTED -> "تم قبول العرض لطلب " + serviceName;
            case QUOTE_REJECTED -> "تم رفض عرضك لطلب " + serviceName;
            case STATUS_UPDATED -> "تم تغيير حالة الطلب";
            case SERVICE_STARTED -> "بدأ العمل على الخدمة";
            case SERVICE_COMPLETED -> "اكتملت الخدمة";
            case REPORT_SUBMITTED -> "تم تقديم تقرير الفحص للطلب";
            case REPORT_APPROVED -> "تم اعتماد تقرير الفحص";
            case INVOICE_CREATED -> "تم إصدار فاتورة للطلب";
            case PAYMENT_HELD -> "تم حجز المبلغ لحاجن الخدمة";
            case PAYMENT_RELEASED -> "تم صرف المبلغ للورشة";
            case ADMIN_OVERRIDE -> "قام المدير بتحديث الطلب";
            case REQUEST_CANCELLED -> "تم إلغاء الطلب";
            default -> "حدث تغيير على طلبك";
        };
    }
}
