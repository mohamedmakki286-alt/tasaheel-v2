package com.tasaheel.websocket;

import com.tasaheel.dto.ChatMessageDTO;
import com.tasaheel.entity.ChatMessage;
import com.tasaheel.entity.ChatRoom;
import com.tasaheel.repository.ChatMessageRepository;
import com.tasaheel.repository.ChatRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.LocalDateTime;

@Controller
@RequiredArgsConstructor
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
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Chat room not found"));

        ChatMessage message = ChatMessage.builder()
                .room(room)
                .senderId(messageDTO.getSenderId())
                .senderRole(messageDTO.getSenderRole())
                .content(messageDTO.getContent())
                .type(messageDTO.getType() != null ? messageDTO.getType() : "text")
                .mediaUrl(messageDTO.getMediaUrl())
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        ChatMessage savedMessage = chatMessageRepository.save(message);

        ChatMessageDTO responseDTO = ChatMessageDTO.builder()
                .id(savedMessage.getId())
                .roomId(roomId)
                .senderId(savedMessage.getSenderId())
                .senderRole(savedMessage.getSenderRole())
                .content(savedMessage.getContent())
                .type(savedMessage.getType())
                .mediaUrl(savedMessage.getMediaUrl())
                .isRead(savedMessage.getIsRead())
                .createdAt(savedMessage.getCreatedAt())
                .build();

        String destination = "/topic/room/" + roomId;
        messagingTemplate.convertAndSend(destination, responseDTO);
    }
}
