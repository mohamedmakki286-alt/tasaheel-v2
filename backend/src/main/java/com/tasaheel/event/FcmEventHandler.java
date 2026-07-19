package com.tasaheel.event;

import com.tasaheel.entity.Customer;
import com.tasaheel.entity.MaintenanceRequest;
import com.tasaheel.entity.Workshop;
import com.tasaheel.integration.FirebaseService;
import com.tasaheel.repository.CustomerRepository;
import com.tasaheel.repository.MaintenanceRequestRepository;
import com.tasaheel.repository.WorkshopRepository;
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

        Customer customer = request.getCustomer();
        if (customer != null && customer.getFcmToken() != null && !customer.getFcmToken().isBlank()) {
            firebaseService.sendNotification(customer.getFcmToken(), title, body, data);
        }

        for (Long workshopId : extractWorkshopIds(request, event)) {
            Workshop workshop = workshopRepository.findById(workshopId).orElse(null);
            if (workshop != null && workshop.getFcmToken() != null && !workshop.getFcmToken().isBlank()) {
                firebaseService.sendNotification(workshop.getFcmToken(), title, body, data);
            }
        }
    }

    private java.util.List<Long> extractWorkshopIds(MaintenanceRequest request, DomainEvent event) {
        if (event.getPayload().containsKey("workshopId")) {
            Object val = event.getPayload().get("workshopId");
            if (val instanceof Number) {
                return java.util.List.of(((Number) val).longValue());
            }
        }
        return java.util.Collections.emptyList();
    }

    private String getTitle(EventType type) {
        return switch (type) {
            case REQUEST_CREATED, REQUEST_SUBMITTED -> "ط·ظ„ط¨ ط¬ط¯ظٹط¯";
            case QUOTE_GENERATED -> "ط¹ط±ط¶ ط³ط¹ط± ط¬ط¯ظٹط¯";
            case OFFER_ACCEPTED -> "طھظ… ظ‚ط¨ظˆظ„ ط§ظ„ط¹ط±ط¶";
            case QUOTE_REJECTED -> "تم رفض عرضك";
            case STATUS_UPDATED -> "طھط­ط¯ظٹط« ط§ظ„ط­ط§ظ„ط©";
            case SERVICE_STARTED -> "ط¨ط¯ط£طھ ط§ظ„ط®ط¯ظ…ط©";
            case SERVICE_COMPLETED -> "ط§ظƒطھظ…ظ„طھ ط§ظ„ط®ط¯ظ…ط©";
            case REPORT_SUBMITTED -> "طھظ‚ط±ظٹط± ط§ظ„ظپط­طµ";
            case REPORT_APPROVED -> "طھظ… ط§ط¹طھظ…ط§ط¯ ط§ظ„طھظ‚ط±ظٹط±";
            case INVOICE_CREATED -> "ظپط§طھظˆط±ط© ط¬ط¯ظٹط¯ط©";
            case PAYMENT_HELD -> "طھظ… ط­ط¬ط² ط§ظ„ط¯ظپط¹";
            case PAYMENT_RELEASED -> "طھظ… طµط±ظپ ط§ظ„ط¯ظپط¹";
            case ADMIN_OVERRIDE -> "طھط¯ط®ظ„ ظ…ط¯ظٹط± ط§ظ„ظ†ط¸ط§ظ…";
            default -> "ط¥ط´ط¹ط§ط±";
        };
    }

    private String getBody(EventType type, MaintenanceRequest request, Map<String, Object> payload) {
        String serviceName = !request.getServiceTypes().isEmpty() ? request.getServiceTypes().get(0).getName() : "";
        return switch (type) {
            case REQUEST_CREATED -> "طھظ… ط¥ظ†ط´ط§ط، ط·ظ„ط¨ ط®ط¯ظ…ط© " + serviceName;
            case REQUEST_SUBMITTED -> "طھظ… طھظ‚ط¯ظٹظ… ط·ظ„ط¨ " + serviceName;
            case QUOTE_GENERATED -> "طھظ… ط§ط³طھظ„ط§ظ… ط¹ط±ط¶ ط³ط¹ط± ظ„ط·ظ„ط¨ " + serviceName;
            case OFFER_ACCEPTED -> "طھظ… ظ‚ط¨ظˆظ„ ط§ظ„ط¹ط±ط¶ ظ„ط·ظ„ط¨ " + serviceName;
            case QUOTE_REJECTED -> "تم رفض عرضك لطلب " + serviceName + " - تم اختيار عرض ورشة أخرى";
            case STATUS_UPDATED -> "طھط؛ظٹط±طھ ط­ط§ظ„ط© ط§ظ„ط·ظ„ط¨: " + getStatusLabel(payload);
            case SERVICE_STARTED -> "ط¨ط¯ط£ ط§ظ„ط¹ظ…ظ„ ط¹ظ„ظ‰ ط§ظ„ط®ط¯ظ…ط©: " + getServiceLabel(payload);
            case SERVICE_COMPLETED -> "ط§ظƒطھظ…ظ„طھ ط§ظ„ط®ط¯ظ…ط©: " + getServiceLabel(payload);
            case REPORT_SUBMITTED -> "طھظ… طھظ‚ط¯ظٹظ… طھظ‚ط±ظٹط± ط§ظ„ظپط­طµ ظ„ظ„ط·ظ„ط¨";
            case REPORT_APPROVED -> "طھظ… ط§ط¹طھظ…ط§ط¯ طھظ‚ط±ظٹط± ط§ظ„ظپط­طµ";
            case INVOICE_CREATED -> "طھظ… ط¥طµط¯ط§ط± ظپط§طھظˆط±ط© ظ„ظ„ط·ظ„ط¨";
            case PAYMENT_HELD -> "طھظ… ط­ط¬ط² ط§ظ„ظ…ط¨ظ„ط؛ ظ„ط­ظٹظ† ط§ظƒطھظ…ط§ظ„ ط§ظ„ط®ط¯ظ…ط©";
            case PAYMENT_RELEASED -> "طھظ… طµط±ظپ ط§ظ„ظ…ط¨ظ„ط؛ ظ„ظ„ظˆط±ط´ط©";
            case ADMIN_OVERRIDE -> "ظ‚ط§ظ… ط§ظ„ظ…ط¯ظٹط± ط¨طھط­ط¯ظٹط« ط§ظ„ط·ظ„ط¨";
            case REQUEST_CANCELLED -> "طھظ… ط¥ظ„ط؛ط§ط، ط§ظ„ط·ظ„ط¨";
            default -> "ظ‡ظ†ط§ظƒ طھط­ط¯ظٹط« ط¹ظ„ظ‰ ط·ظ„ط¨ظƒ";
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
            return "ط±ظ‚ظ… " + payload.get("serviceItemId");
        }
        return "";
    }
}
