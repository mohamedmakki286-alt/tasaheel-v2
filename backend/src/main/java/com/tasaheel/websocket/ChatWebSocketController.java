package com.tasaheel.websocket;

import com.tasaheel.dto.ChatMessageDTO;
import com.tasaheel.security.UserDetailsImpl;
import com.tasaheel.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatWebSocketController {

    private final ChatService chatService;

    @MessageMapping("/chat/send/{roomId}")
    public void sendMessage(
            @DestinationVariable Long roomId,
            @Payload ChatMessageDTO messageDTO,
            SimpMessageHeaderAccessor headerAccessor
    ) {
        Principal principal = headerAccessor.getUser();
        UserDetailsImpl user = extractUser(principal);
        if (user == null) {
            log.warn("WebSocket chat message rejected: no authenticated user");
            return;
        }
        chatService.sendMessage(roomId, user, messageDTO.getContent(), messageDTO.getType(), messageDTO.getMediaUrl());
    }

    private UserDetailsImpl extractUser(Principal principal) {
        if (principal instanceof UserDetailsImpl user) return user;
        if (principal instanceof UsernamePasswordAuthenticationToken authentication
                && authentication.getPrincipal() instanceof UserDetailsImpl user) {
            return user;
        }
        return null;
    }
}
