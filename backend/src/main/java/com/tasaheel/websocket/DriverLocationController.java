package com.tasaheel.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;

import java.util.Map;
import java.util.concurrent.TimeUnit;

@Controller
@RequiredArgsConstructor
@Slf4j
public class DriverLocationController {

    private final SimpMessageSendingOperations messagingTemplate;
    @Autowired(required = false)
    private RedisTemplate<String, Object> redisTemplate;

    private static final String DRIVER_LOCATION_KEY = "driver:locations";

    @MessageMapping("/driver/location")
    public void updateLocation(@Payload Map<String, Object> payload) {
        Long driverId = Long.valueOf(payload.get("driverId").toString());
        Double latitude = Double.valueOf(payload.get("latitude").toString());
        Double longitude = Double.valueOf(payload.get("longitude").toString());

        if (redisTemplate != null) {
            String locationKey = "driver:" + driverId;
            Map<String, String> locationData = Map.of(
                    "latitude", String.valueOf(latitude),
                    "longitude", String.valueOf(longitude),
                    "timestamp", String.valueOf(System.currentTimeMillis())
            );

            redisTemplate.opsForHash().putAll(DRIVER_LOCATION_KEY + ":" + locationKey, locationData);
            redisTemplate.expire(DRIVER_LOCATION_KEY + ":" + locationKey, 1, TimeUnit.HOURS);
        }

        log.debug("Driver {} location updated: {}, {}", driverId, latitude, longitude);

        messagingTemplate.convertAndSend("/topic/driver/" + driverId + "/location", payload);

        String requestId = payload.get("requestId") != null ? payload.get("requestId").toString() : null;
        if (requestId != null) {
            messagingTemplate.convertAndSend("/topic/request/" + requestId + "/driver-location", payload);
        }

        messagingTemplate.convertAndSend("/topic/admin/driver-locations", payload);
    }

    @MessageMapping("/driver/status")
    public void updateStatus(@Payload Map<String, Object> payload) {
        Long driverId = Long.valueOf(payload.get("driverId").toString());
        String status = payload.get("status").toString();

        if (redisTemplate != null) {
            redisTemplate.opsForHash().put("driver:status", "driver:" + driverId, status);
        }

        messagingTemplate.convertAndSend("/topic/driver/" + driverId + "/status", payload);
    }
}
