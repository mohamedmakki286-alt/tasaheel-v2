package com.tasaheel.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {

    private final SimpMessageSendingOperations messagingTemplate;
    @Autowired(required = false)
    private RedisTemplate<String, Object> redisTemplate;

    private static final String ONLINE_DRIVERS_KEY = "online:drivers";

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        Principal principal = event.getUser();
        if (principal != null) {
            log.info("WebSocket connected: {}", principal.getName());
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        Principal principal = event.getUser();
        if (principal != null) {
            String userId = principal.getName();
            log.info("WebSocket disconnected: {}", userId);

            if (redisTemplate != null) {
                String driverId = (String) redisTemplate.opsForHash().get(ONLINE_DRIVERS_KEY, "session:" + userId);
                if (driverId != null) {
                    redisTemplate.opsForHash().delete(ONLINE_DRIVERS_KEY, "session:" + userId);
                    messagingTemplate.convertAndSend("/topic/drivers/offline", driverId);
                }
            }
        }
    }

    public void markDriverOnline(Long driverId, String sessionId) {
        if (redisTemplate == null) return;
        redisTemplate.opsForHash().put(ONLINE_DRIVERS_KEY, "session:" + sessionId, String.valueOf(driverId));
        redisTemplate.opsForHash().put(ONLINE_DRIVERS_KEY, "driver:" + driverId, sessionId);
        redisTemplate.expire(ONLINE_DRIVERS_KEY, 24, TimeUnit.HOURS);
    }

    public void markDriverOffline(Long driverId) {
        if (redisTemplate == null) return;
        String sessionId = (String) redisTemplate.opsForHash().get(ONLINE_DRIVERS_KEY, "driver:" + driverId);
        if (sessionId != null) {
            redisTemplate.opsForHash().delete(ONLINE_DRIVERS_KEY, "session:" + sessionId, "driver:" + driverId);
        }
    }

    public boolean isDriverOnline(Long driverId) {
        if (redisTemplate == null) return false;
        return redisTemplate.opsForHash().hasKey(ONLINE_DRIVERS_KEY, "driver:" + driverId);
    }
}
