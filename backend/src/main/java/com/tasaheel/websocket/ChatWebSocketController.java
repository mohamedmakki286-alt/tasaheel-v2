package com.tasaheel.websocket;

import com.tasaheel.dto.ChatMessageDTO;
import com.tasaheel.entity.ChatMessage;
import com.tasaheel.entity.ChatRoom;
import com.tasaheel.entity.MessageType;
import com.tasaheel.repository.ChatMessageRepository;
import com.tasaheel.repository.ChatRoomRepository;
import com.tasaheel.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatWebSocketController {

    private final ChatMessageRepository chatMessageRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final SimpMessageSendingOperations messagingTemplate;

    @MessageMapping("/chat/send/{roomId}")
    public void sendMessage(
            @DestinationVariable Long roomId,
            @Payload ChatMessageDTO messageDTO,
            SimpMessageHeaderAccessor headerAccessor
    ) {
        Principal principal = headerAccessor.getUser();
        if (principal == null || !(principal instanceof UserDetailsImpl)) {
            log.warn("WebSocket chat message rejected: no authenticated user");
            return;
        }
        UserDetailsImpl user = (UserDetailsImpl) principal;

        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElse(null);
        if (room == null) {
            log.warn("WebSocket chat message rejected: room {} not found", roomId);
            return;
        }

        boolean isParticipant =
            ("customer".equals(user.getRole()) && room.getCustomer() != null && room.getCustomer().getId().equals(user.getUserId()))
            || ("workshop".equals(user.getRole()) && room.getWorkshop() != null && room.getWorkshop().getId().equals(user.getUserId()))
            || ("driver".equals(user.getRole()) && room.getDriver() != null && room.getDriver().getId().equals(user.getUserId()))
            || ("technician".equals(user.getRole()) && room.getTechnician() != null && room.getTechnician().getId().equals(user.getUserId()));

        if (!isParticipant) {
            log.warn("WebSocket chat message rejected: user {} is not a participant in room {}", user.getUserId(), roomId);
            return;
        }

        MessageType messageType = MessageType.fromString(messageDTO.getType());

        ChatMessage message = ChatMessage.builder()
                .room(room)
                .senderId(user.getUserId())
                .senderRole(user.getRole().toLowerCase())
                .content(messageDTO.getContent() != null ? messageDTO.getContent() : "")
                .type(messageType)
                .mediaUrl(messageDTO.getMediaUrl())
                .clientMessageId(messageDTO.getClientMessageId())
                .isRead(false)
                .build();

        ChatMessage savedMessage = chatMessageRepository.save(message);

        ChatMessageDTO responseDTO = ChatMessageDTO.builder()
                .id(savedMessage.getId())
                .roomId(roomId)
                .senderId(savedMessage.getSenderId())
                .senderRole(savedMessage.getSenderRole())
                .content(savedMessage.getContent())
                .type(savedMessage.getType() != null ? savedMessage.getType().name() : "TEXT")
                .mediaUrl(savedMessage.getMediaUrl())
                .isRead(savedMessage.getIsRead())
                .createdAt(savedMessage.getCreatedAt())
                .clientMessageId(savedMessage.getClientMessageId())
                .build();

        String destination = "/topic/room/" + roomId;
        messagingTemplate.convertAndSend(destination, responseDTO);
    }
}
