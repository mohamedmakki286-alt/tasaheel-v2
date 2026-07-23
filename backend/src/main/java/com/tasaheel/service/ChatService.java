package com.tasaheel.service;

import com.tasaheel.dto.ChatMessageDTO;
import com.tasaheel.dto.ChatRoomDTO;
import com.tasaheel.entity.*;
import com.tasaheel.exception.ResourceNotFoundException;
import com.tasaheel.repository.*;
import com.tasaheel.exception.BadRequestException;
import com.tasaheel.integration.MediaService;
import com.tasaheel.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatAttachmentRepository chatAttachmentRepository;
    private final MaintenanceRequestRepository requestRepository;
    private final CustomerRepository customerRepository;
    private final WorkshopRepository workshopRepository;
    private final DriverRepository driverRepository;
    private final TechnicianRepository technicianRepository;
    private final QuoteRepository quoteRepository;
    private final MediaService mediaService;
    private final SimpMessageSendingOperations messagingTemplate;

    @Transactional
    public ChatRoomDTO getOrCreateRoom(Long requestId, Long customerId, Long workshopId, Long driverId) {
        ChatRoom existingRoom = null;

        if (workshopId != null) {
            existingRoom = chatRoomRepository
                    .findByRequestIdAndCustomerIdAndWorkshopId(requestId, customerId, workshopId)
                    .orElse(null);
        } else if (driverId != null) {
            existingRoom = chatRoomRepository
                    .findByRequestIdAndCustomerIdAndDriverId(requestId, customerId, driverId)
                    .orElse(null);
        }

        if (existingRoom != null) {
            return toChatRoomDTO(existingRoom);
        }

        MaintenanceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request", requestId));
        if (!request.getCustomer().getId().equals(customerId)) {
            throw new BadRequestException("لست صاحب هذا الطلب");
        }
        if (workshopId != null && !quoteRepository.findByRequestIdAndStatus(requestId, "accepted")
                .map(quote -> quote.getWorkshop().getId().equals(workshopId)).orElse(false)) {
            throw new BadRequestException("المحادثة متاحة فقط مع الورشة المختارة");
        }
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", customerId));
        Workshop workshop = workshopId != null ? workshopRepository.findById(workshopId).orElse(null) : null;
        Driver driver = driverId != null ? driverRepository.findById(driverId).orElse(null) : null;

        ChatRoom room = ChatRoom.builder()
                .request(request)
                .customer(customer)
                .workshop(workshop)
                .driver(driver)
                .build();

        room = chatRoomRepository.save(room);
        return toChatRoomDTO(room);
    }

    @Transactional
    public ChatMessageDTO sendMessage(Long roomId, UserDetailsImpl user,
                                       String content, String type, String mediaUrl) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatRoom", roomId));
        requireRoomParticipant(room, user);
        String senderRole = user.getRole().toLowerCase();

        MessageType messageType = MessageType.fromString(type);

        ChatMessage message = ChatMessage.builder()
                .room(room)
                .senderId(user.getUserId())
                .senderRole(senderRole)
                .content(content != null ? content : "")
                .type(messageType)
                .mediaUrl(mediaUrl)
                .isRead(false)
                .build();

        message = chatMessageRepository.save(message);

        ChatMessageDTO dto = toChatMessageDTO(message);

        String destination = "/topic/room/" + roomId;
        messagingTemplate.convertAndSend(destination, dto);

        return dto;
    }

    @Transactional
    public ChatMessageDTO sendAttachmentMessage(Long roomId, UserDetailsImpl user,
                                                 String text, String clientMessageId,
                                                 org.springframework.web.multipart.MultipartFile file) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatRoom", roomId));
        requireRoomParticipant(room, user);

        if (clientMessageId != null && !clientMessageId.isBlank()) {
            boolean exists = chatMessageRepository.existsByClientMessageId(clientMessageId);
            if (exists) {
                ChatMessage existing = chatMessageRepository.findByClientMessageId(clientMessageId).orElse(null);
                if (existing != null) return toChatMessageDTO(existing);
            }
        }

        Map<String, Object> fileData = mediaService.storeFileWithMetadata(file, "chat");

        String contentType = file.getContentType();
        MessageType messageType = MessageType.TEXT;
        if (contentType != null) {
            if (contentType.startsWith("image/")) messageType = MessageType.IMAGE;
            else if (contentType.startsWith("audio/")) messageType = MessageType.AUDIO;
            else messageType = MessageType.FILE;
        }

        String senderRole = user.getRole().toLowerCase();
        String content = (text != null && !text.isBlank()) ? text : "";

        ChatMessage message = ChatMessage.builder()
                .room(room)
                .senderId(user.getUserId())
                .senderRole(senderRole)
                .content(content)
                .type(messageType)
                .mediaUrl((String) fileData.get("fileUrl"))
                .clientMessageId(clientMessageId)
                .isRead(false)
                .build();

        message = chatMessageRepository.save(message);

        ChatAttachment attachment = ChatAttachment.builder()
                .message(message)
                .storageKey((String) fileData.get("storageKey"))
                .fileUrl((String) fileData.get("fileUrl"))
                .originalFileName((String) fileData.get("originalFileName"))
                .mimeType((String) fileData.get("mimeType"))
                .fileSize((Long) fileData.get("fileSize"))
                .build();

        chatAttachmentRepository.save(attachment);

        ChatMessageDTO dto = toChatMessageDTO(message);

        String destination = "/topic/room/" + roomId;
        messagingTemplate.convertAndSend(destination, dto);

        return dto;
    }

    public Page<ChatMessageDTO> getMessages(Long roomId, UserDetailsImpl user, int page, int size) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatRoom", roomId));
        requireRoomParticipant(room, user);
        Page<ChatMessage> messages = chatMessageRepository
                .findByRoomIdOrderByCreatedAtAsc(roomId, PageRequest.of(page, size));
        return messages.map(this::toChatMessageDTO);
    }

    public ChatRoomDTO getRoomByRequestId(Long requestId, UserDetailsImpl user) {
        ChatRoom room = chatRoomRepository.findByRequestId(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatRoom for request", requestId));
        requireRoomParticipant(room, user);
        return toChatRoomDTO(room);
    }

    @Transactional
    public void markAsRead(Long roomId, UserDetailsImpl user) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatRoom", roomId));
        requireRoomParticipant(room, user);
        chatMessageRepository.markAsReadByRoomIdAndSenderIdNot(roomId, user.getUserId());
    }

    private void requireRoomParticipant(ChatRoom room, UserDetailsImpl user) {
        String role = user.getRole().toLowerCase();
        boolean permitted = ("customer".equals(role) && room.getCustomer() != null && room.getCustomer().getId().equals(user.getUserId()))
                || ("workshop".equals(role) && room.getWorkshop() != null && room.getWorkshop().getId().equals(user.getUserId()))
                || ("driver".equals(role) && room.getDriver() != null && room.getDriver().getId().equals(user.getUserId()))
                || ("technician".equals(role) && room.getTechnician() != null && room.getTechnician().getId().equals(user.getUserId()));
        if (!permitted) throw new BadRequestException("لست مشاركاً في هذه المحادثة");
    }

    private ChatRoomDTO toChatRoomDTO(ChatRoom room) {
        Page<ChatMessage> lastPage = chatMessageRepository
                .findByRoomIdOrderByCreatedAtAsc(room.getId(), PageRequest.of(0, 1,
                        org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt")));

        ChatMessage lastMsg = lastPage.isEmpty() ? null : lastPage.getContent().get(0);

        long unreadCount = lastMsg != null
                ? chatMessageRepository.countByRoomIdAndIsReadFalseAndSenderIdNot(room.getId(), lastMsg.getSenderId())
                : 0;

        ChatMessageDTO lastMessageDTO = lastMsg != null ? toChatMessageDTO(lastMsg) : null;

        return ChatRoomDTO.builder()
                .id(room.getId())
                .requestId(room.getRequest().getId())
                .customerId(room.getCustomer().getId())
                .customerName(room.getCustomer().getName())
                .workshopId(room.getWorkshop() != null ? room.getWorkshop().getId() : null)
                .workshopName(room.getWorkshop() != null ? room.getWorkshop().getName() : null)
                .driverId(room.getDriver() != null ? room.getDriver().getId() : null)
                .driverName(room.getDriver() != null ? room.getDriver().getName() : null)
                .technicianId(room.getTechnician() != null ? room.getTechnician().getId() : null)
                .technicianName(room.getTechnician() != null ? room.getTechnician().getName() : null)
                .lastMessage(lastMessageDTO)
                .unreadCount(unreadCount)
                .createdAt(room.getCreatedAt())
                .build();
    }

    private ChatMessageDTO toChatMessageDTO(ChatMessage msg) {
        String senderName = "";
        if ("customer".equals(msg.getSenderRole())) {
            Customer customer = customerRepository.findById(msg.getSenderId()).orElse(null);
            senderName = customer != null ? customer.getName() : "";
        } else if ("workshop".equals(msg.getSenderRole())) {
            Workshop workshop = workshopRepository.findById(msg.getSenderId()).orElse(null);
            senderName = workshop != null ? workshop.getName() : "";
        } else if ("driver".equals(msg.getSenderRole())) {
            Driver driver = driverRepository.findById(msg.getSenderId()).orElse(null);
            senderName = driver != null ? driver.getName() : "";
        } else if ("technician".equals(msg.getSenderRole())) {
            Technician technician = technicianRepository.findById(msg.getSenderId()).orElse(null);
            senderName = technician != null ? technician.getName() : "";
        }

        ChatMessageDTO.AttachmentDTO attachmentDTO = null;
        if (msg.getAttachment() != null) {
            ChatAttachment att = msg.getAttachment();
            attachmentDTO = ChatMessageDTO.AttachmentDTO.builder()
                    .id(att.getId())
                    .url(att.getFileUrl())
                    .mimeType(att.getMimeType())
                    .fileSize(att.getFileSize())
                    .originalFileName(att.getOriginalFileName())
                    .durationSeconds(att.getDurationSeconds())
                    .width(att.getWidth())
                    .height(att.getHeight())
                    .build();
        }

        return ChatMessageDTO.builder()
                .id(msg.getId())
                .roomId(msg.getRoom().getId())
                .senderId(msg.getSenderId())
                .senderRole(msg.getSenderRole())
                .senderName(senderName)
                .content(msg.getContent())
                .type(msg.getType() != null ? msg.getType().name() : "TEXT")
                .mediaUrl(msg.getMediaUrl())
                .isRead(msg.getIsRead())
                .createdAt(msg.getCreatedAt())
                .clientMessageId(msg.getClientMessageId())
                .attachment(attachmentDTO)
                .build();
    }
}
