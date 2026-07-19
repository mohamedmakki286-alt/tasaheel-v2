package com.tasaheel.repository;

import com.tasaheel.entity.PaymentHold;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PaymentHoldRepository extends JpaRepository<PaymentHold, Long> {
    Optional<PaymentHold> findByRequestId(Long requestId);
    List<PaymentHold> findByCustomerId(Long customerId);
    List<PaymentHold> findByWorkshopId(Long workshopId);
    List<PaymentHold> findByStatus(String status);
}
