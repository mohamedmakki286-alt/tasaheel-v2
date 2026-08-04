package com.tasaheel.repository;
import com.tasaheel.entity.SupportTicket; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface SupportTicketRepository extends JpaRepository<SupportTicket,Long> {
 List<SupportTicket> findByCustomerIdOrderByLastMessageAtDesc(Long customerId);
 List<SupportTicket> findAllByOrderByLastMessageAtDesc();
}
