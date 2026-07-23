package com.tasaheel.repository;

import com.tasaheel.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByRoomIdOrderByCreatedAtAsc(Long roomId);
    Page<ChatMessage> findByRoomIdOrderByCreatedAtAsc(Long roomId, Pageable pageable);
    long countByRoomIdAndIsReadFalseAndSenderIdNot(Long roomId, Long senderId);
    boolean existsByClientMessageId(String clientMessageId);
    Optional<ChatMessage> findByClientMessageId(String clientMessageId);
    @Modifying
    @Transactional
    @Query("UPDATE ChatMessage m SET m.isRead = true WHERE m.room.id = :roomId AND m.senderId <> :senderId AND m.isRead = false")
    void markAsReadByRoomIdAndSenderIdNot(@Param("roomId") Long roomId, @Param("senderId") Long senderId);
}
