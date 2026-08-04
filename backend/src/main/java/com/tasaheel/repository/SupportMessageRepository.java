package com.tasaheel.repository;
import com.tasaheel.entity.SupportMessage; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface SupportMessageRepository extends JpaRepository<SupportMessage,Long> { List<SupportMessage> findByTicketIdOrderByCreatedAtAsc(Long ticketId); }
