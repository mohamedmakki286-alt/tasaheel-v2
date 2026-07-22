package com.tasaheel.config;

import com.tasaheel.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtService jwtService;

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes
    ) {
        String query = request.getURI().getQuery();
        if (query == null) return true;

        String token = extractTokenFromQuery(query);
        if (token == null) return true;

        try {
            if (jwtService.isTokenValid(token)) {
                Long userId = jwtService.extractUserId(token);
                String role = jwtService.extractRole(token);
                attributes.put("userId", userId);
                attributes.put("role", role);
                log.debug("WS handshake authenticated: userId={}, role={}", userId, role);
                return true;
            }
        } catch (Exception e) {
            log.warn("WS handshake JWT validation failed: {}", e.getMessage());
        }

        return true;
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception
    ) {
    }

    private String extractTokenFromQuery(String query) {
        for (String param : query.split("&")) {
            String[] kv = param.split("=", 2);
            if (kv.length == 2 && "token".equals(kv[0])) {
                String val = kv[1];
                if (val.startsWith("Bearer_")) {
                    return val.substring(7);
                }
                return val;
            }
        }
        return null;
    }
}
