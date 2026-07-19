package com.tasaheel.event;

import com.tasaheel.entity.MaintenanceRequest;
import com.tasaheel.repository.MaintenanceRequestRepository;
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

            log.debug("Broadcast event {} for request {}", event.getEventType(), event.getRequestId());
        } catch (Exception e) {
            log.error("Failed to broadcast event {}: {}", event.getEventType(), e.getMessage());
        }
    }
}
