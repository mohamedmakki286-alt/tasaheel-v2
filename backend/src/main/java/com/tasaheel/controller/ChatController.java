package com.tasaheel.controller;

import com.tasaheel.dto.*;
import com.tasaheel.security.UserDetailsImpl;
import com.tasaheel.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChatController {

    private final ChatService chatService;
    private final MessageSource msg;

    @PostMapping("/room")
    public ResponseEntity<ApiResponse<ChatRoomDTO>> getOrCreateRoom(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestBody Map<String, Long> body) {
        Long requestId = body.get("requestId");
        Long customerId = user.getUserId();
        Long workshopId = body.get("workshopId");
        Long driverId = body.get("driverId");

        ChatRoomDTO room = chatService.getOrCreateRoom(requestId, customerId, workshopId, driverId);
        return ResponseEntity.ok(ApiResponse.success(room));
    }

    @GetMapping("/room/{requestId}")
    public ResponseEntity<ApiResponse<ChatRoomDTO>> getRoomByRequest(
            @AuthenticationPrincipal UserDetailsImpl user, @PathVariable Long requestId) {
        ChatRoomDTO room = chatService.getRoomByRequestId(requestId, user);
        return ResponseEntity.ok(ApiResponse.success(room));
    }

    @GetMapping("/room/{roomId}/messages")
    public ResponseEntity<ApiResponse<Page<ChatMessageDTO>>> getMessages(
            @AuthenticationPrincipal UserDetailsImpl user, @PathVariable Long roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Page<ChatMessageDTO> messages = chatService.getMessages(roomId, user, page, size);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @PostMapping("/room/{roomId}/messages")
    public ResponseEntity<ApiResponse<ChatMessageDTO>> sendMessage(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long roomId,
            @Valid @RequestBody ChatMessageDTO dto) {
        ChatMessageDTO message = chatService.sendMessage(
                roomId, user,
                dto.getContent(), dto.getType(), dto.getMediaUrl());
        Locale locale = LocaleContextHolder.getLocale();
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("chat.sent", null, locale), message));
    }

    @PutMapping("/room/{roomId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long roomId) {
        chatService.markAsRead(roomId, user);
        Locale locale = LocaleContextHolder.getLocale();
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("chat.read", null, locale), null));
    }
}
