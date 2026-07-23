package com.tasaheel.config;

import com.tasaheel.security.JwtService;
import com.tasaheel.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) return message;

        StompCommand command = accessor.getCommand();
        if (command == null) return message;

        switch (command) {
            case CONNECT -> handleConnect(accessor);
            case SUBSCRIBE -> handleSubscribe(accessor);
            case SEND -> handleSend(accessor);
            case DISCONNECT -> handleDisconnect(accessor);
            default -> {}
        }

        return message;
    }

    @Override
    public void afterSendCompletion(Message<?> message, MessageChannel channel, boolean sent, Exception ex) {
        StompUserHolder.clear();
    }

    private void handleConnect(StompHeaderAccessor accessor) {
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("STOMP CONNECT without Authorization header");
            return;
        }

        String token = authHeader.substring(7);
        try {
            if (!jwtService.isTokenValid(token)) {
                log.warn("STOMP CONNECT with invalid/expired JWT");
                return;
            }

            Long userId = jwtService.extractUserId(token);
            String role = jwtService.extractRole(token);

            List<SimpleGrantedAuthority> authorities = List.of(
                    new SimpleGrantedAuthority("ROLE_" + role.toUpperCase())
            );
            UserDetailsImpl userDetails = new UserDetailsImpl(userId, role, authorities);
            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    userDetails, null, authorities
            );

            accessor.setUser(auth);

            Map<String, Object> sessionAttrs = accessor.getSessionAttributes();
            if (sessionAttrs != null) {
                sessionAttrs.put("userId", userId);
                sessionAttrs.put("role", role);
            }

            StompUserHolder.set(userId, role);
            log.debug("STOMP CONNECT authenticated: userId={}, role={}", userId, role);
        } catch (Exception e) {
            log.warn("STOMP CONNECT JWT processing failed: {}", e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private void handleSubscribe(StompHeaderAccessor accessor) {
        Map<String, Object> sessionAttrs = accessor.getSessionAttributes();
        if (sessionAttrs != null) {
            Object userIdObj = sessionAttrs.get("userId");
            Object roleObj = sessionAttrs.get("role");
            if (userIdObj != null && roleObj != null) {
                Long userId = userIdObj instanceof Long ? (Long) userIdObj
                        : Long.parseLong(userIdObj.toString());
                StompUserHolder.set(userId, roleObj.toString());
            }
        }

        Object userObj = accessor.getUser();
        if (userObj == null) {
            log.warn("STOMP SUBSCRIBE without authentication — rejecting");
            accessor.setLeaveMutable(true);
            return;
        }

        if (userObj instanceof UsernamePasswordAuthenticationToken auth
                && auth.getPrincipal() instanceof UserDetailsImpl principal) {

            String destination = accessor.getDestination();
            if (destination == null) return;

            if (destination.startsWith("/user/")) {
                String queuePath = destination.substring("/user/".length());
                if (queuePath.contains("/")) {
                    String subscriberIdStr = queuePath.substring(0, queuePath.indexOf("/"));
                    try {
                        long subscriberId = Long.parseLong(subscriberIdStr);
                        if (subscriberId != principal.getUserId()) {
                            log.warn("SECURITY: User {} attempted to subscribe to user {} queue: {}",
                                    principal.getUserId(), subscriberId, destination);
                            accessor.setLeaveMutable(true);
                        }
                    } catch (NumberFormatException ignored) {
                    }
                }
            }
        }
    }

    @SuppressWarnings("unchecked")
    private void handleSend(StompHeaderAccessor accessor) {
        Map<String, Object> sessionAttrs = accessor.getSessionAttributes();
        if (sessionAttrs != null) {
            Object userIdObj = sessionAttrs.get("userId");
            Object roleObj = sessionAttrs.get("role");
            if (userIdObj != null && roleObj != null) {
                Long userId = userIdObj instanceof Long ? (Long) userIdObj
                        : Long.parseLong(userIdObj.toString());
                StompUserHolder.set(userId, roleObj.toString());
            }
        }

        Object userObj = accessor.getUser();
        if (userObj == null) {
            log.warn("STOMP SEND without authentication — rejecting");
            accessor.setLeaveMutable(true);
        }
    }

    private void handleDisconnect(StompHeaderAccessor accessor) {
        Map<String, Object> sessionAttrs = accessor.getSessionAttributes();
        if (sessionAttrs != null) {
            Object userIdObj = sessionAttrs.get("userId");
            if (userIdObj != null) {
                Long userId = userIdObj instanceof Long ? (Long) userIdObj
                        : Long.parseLong(userIdObj.toString());
                log.debug("STOMP DISCONNECT: userId={}", userId);
            }
        }
    }
}
