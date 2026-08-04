package com.tasaheel.repository;
import com.tasaheel.entity.SupportStatusHistory; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface SupportStatusHistoryRepository extends JpaRepository<SupportStatusHistory,Long> { List<SupportStatusHistory> findByTicketIdOrderByCreatedAtAsc(Long ticketId); }
