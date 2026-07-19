package com.tasaheel.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Getter
public class DomainEvent extends ApplicationEvent {

    private final EventType eventType;
    private final Long requestId;
    private final String actorRole;
    private final Long actorId;
    private final Map<String, Object> payload;

    @Getter(lombok.AccessLevel.NONE)
    private final LocalDateTime eventTimestamp;

    public DomainEvent(Object source, EventType eventType, Long requestId, String actorRole, Long actorId) {
        super(source);
        this.eventType = eventType;
        this.requestId = requestId;
        this.actorRole = actorRole;
        this.actorId = actorId;
        this.payload = new HashMap<>();
        this.eventTimestamp = LocalDateTime.now();
    }

    public LocalDateTime getEventTimestamp() { return eventTimestamp; }

    public DomainEvent withPayload(String key, Object value) {
        this.payload.put(key, value);
        return this;
    }

    public DomainEvent withPayload(Map<String, Object> extra) {
        if (extra != null) {
            this.payload.putAll(extra);
        }
        return this;
    }
}
