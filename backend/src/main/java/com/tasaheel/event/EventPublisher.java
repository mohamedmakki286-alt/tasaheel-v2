package com.tasaheel.event;

import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class EventPublisher {

    private final ApplicationEventPublisher applicationEventPublisher;

    public void publish(Object source, EventType eventType, Long requestId, String actorRole, Long actorId) {
        DomainEvent event = new DomainEvent(source, eventType, requestId, actorRole, actorId);
        applicationEventPublisher.publishEvent(event);
    }

    public void publish(Object source, EventType eventType, Long requestId, String actorRole, Long actorId, Map<String, Object> payload) {
        DomainEvent event = new DomainEvent(source, eventType, requestId, actorRole, actorId);
        if (payload != null) {
            event.withPayload(payload);
        }
        applicationEventPublisher.publishEvent(event);
    }

    public void publish(Object source, EventType eventType, Long requestId, String actorRole, Long actorId, String key, Object value) {
        DomainEvent event = new DomainEvent(source, eventType, requestId, actorRole, actorId);
        event.withPayload(key, value);
        applicationEventPublisher.publishEvent(event);
    }
}
