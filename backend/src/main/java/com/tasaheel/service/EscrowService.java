package com.tasaheel.service;

import com.tasaheel.entity.*;
import com.tasaheel.event.EventPublisher;
import com.tasaheel.event.EventType;
import com.tasaheel.exception.BadRequestException;
import com.tasaheel.exception.ResourceNotFoundException;
import com.tasaheel.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EscrowService {

    private final PaymentHoldRepository paymentHoldRepository;
    private final MaintenanceRequestRepository requestRepository;
    private final CustomerRepository customerRepository;
    private final WorkshopRepository workshopRepository;
    private final ServiceItemRepository serviceItemRepository;
    private final QuoteRepository quoteRepository;
    private final EventPublisher eventPublisher;
    private final MessageSource msg;

    @Transactional
    public PaymentHold holdPayment(Long requestId, Long customerId) {
        MaintenanceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request", requestId));
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", customerId));

        if (!request.getCustomer().getId().equals(customerId)) {
            throw new BadRequestException(msg.getMessage("escrow.not.owner", null, LocaleContextHolder.getLocale()));
        }

        if (paymentHoldRepository.findByRequestId(requestId).isPresent()) {
            throw new BadRequestException(msg.getMessage("escrow.already.held", null, LocaleContextHolder.getLocale()));
        }

        double amount = quoteRepository.findByRequestIdOrderByCreatedAtAsc(requestId).stream()
                .filter(q -> "accepted".equals(q.getStatus()))
                .mapToDouble(q -> q.getPrice() != null ? q.getPrice() : 0.0)
                .sum();
        if (amount <= 0) amount = 500.0;

        PaymentHold hold = PaymentHold.builder()
                .request(request)
                .customer(customer)
                .amount(amount)
                .status("HELD")
                .build();
        hold = paymentHoldRepository.save(hold);

        eventPublisher.publish(this, EventType.PAYMENT_HELD, requestId, "customer", customerId);
        return hold;
    }

    @Transactional
    public PaymentHold releasePayment(Long requestId, Long workshopId, Long adminId) {
        Locale locale = LocaleContextHolder.getLocale();
        PaymentHold hold = paymentHoldRepository.findByRequestId(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("PaymentHold", "requestId", requestId.toString()));

        if (!"HELD".equals(hold.getStatus())) {
            throw new BadRequestException(msg.getMessage("escrow.not.held", null, locale));
        }

        Workshop workshop = workshopRepository.findById(workshopId)
                .orElseThrow(() -> new ResourceNotFoundException("Workshop", workshopId));

        hold.setStatus("RELEASED");
        hold.setReleasedAt(LocalDateTime.now());
        hold.setWorkshop(workshop);
        paymentHoldRepository.save(hold);

        eventPublisher.publish(this, EventType.PAYMENT_RELEASED, requestId, "admin", adminId,
                java.util.Map.of("workshopId", workshopId, "amount", hold.getAmount()));

        return hold;
    }

    @Transactional
    public PaymentHold refundPayment(Long requestId, Long adminId) {
        Locale locale = LocaleContextHolder.getLocale();
        PaymentHold hold = paymentHoldRepository.findByRequestId(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("PaymentHold", "requestId", requestId.toString()));

        if (!"HELD".equals(hold.getStatus())) {
            throw new BadRequestException(msg.getMessage("escrow.not.held", null, locale));
        }

        hold.setStatus("REFUNDED");
        hold.setRefundedAt(LocalDateTime.now());
        paymentHoldRepository.save(hold);

        eventPublisher.publish(this, EventType.PAYMENT_REFUNDED, requestId, "admin", adminId);

        return hold;
    }

    public PaymentHold getHoldByRequest(Long requestId) {
        return paymentHoldRepository.findByRequestId(requestId).orElse(null);
    }

    public List<PaymentHold> getCustomerHolds(Long customerId) {
        return paymentHoldRepository.findByCustomerId(customerId);
    }

    public List<PaymentHold> getAllHolds() {
        return paymentHoldRepository.findAll();
    }
}
