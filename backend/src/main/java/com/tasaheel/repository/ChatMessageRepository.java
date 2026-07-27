package com.tasaheel.repository;

import com.tasaheel.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByRoomIdOrderByCreatedAtAsc(Long roomId);
    @EntityGraph(attributePaths = {"room", "attachment"})
    Page<ChatMessage> findByRoomId(Long roomId, Pageable pageable);
    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.room.id = :roomId AND m.isRead = false AND NOT (m.senderId = :senderId AND m.senderRole = :senderRole)")
    long countUnreadForViewer(@Param("roomId") Long roomId, @Param("senderId") Long senderId,
                              @Param("senderRole") String senderRole);
    boolean existsByClientMessageId(String clientMessageId);
    Optional<ChatMessage> findByClientMessageId(String clientMessageId);
    @Modifying
    @Transactional
    @Query("UPDATE ChatMessage m SET m.isRead = true WHERE m.room.id = :roomId AND NOT (m.senderId = :senderId AND m.senderRole = :senderRole) AND m.isRead = false")
    void markAsReadForViewer(@Param("roomId") Long roomId, @Param("senderId") Long senderId,
                             @Param("senderRole") String senderRole);
}
