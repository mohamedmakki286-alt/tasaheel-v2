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

@Service
@RequiredArgsConstructor
public class EscrowService {

    private final PaymentHoldRepository paymentHoldRepository;
    private final MaintenanceRequestRepository requestRepository;
    private final CustomerRepository customerRepository;
    private final QuoteRepository quoteRepository;
    private final PaymentRepository paymentRepository;
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

        Payment completedPayment = paymentRepository
                .findFirstByRequestIdAndStatusOrderByCreatedAtDesc(requestId, "completed")
                .orElseThrow(() -> new BadRequestException(
                        "A verified completed payment is required before creating a hold"));
        Quote acceptedQuote = quoteRepository.findByRequestIdAndStatus(requestId, "accepted")
                .orElseThrow(() -> new BadRequestException("No accepted workshop quote found"));

        PaymentHold hold = PaymentHold.builder()
                .request(request)
                .customer(customer)
                .workshop(acceptedQuote.getWorkshop())
                .amount(completedPayment.getAmount())
                .status("HELD")
                .build();
        hold = paymentHoldRepository.save(hold);

        eventPublisher.publish(this, EventType.PAYMENT_HELD, requestId, "customer", customerId);
        return hold;
    }

    /** Creates the hold as part of verified payment completion; safe to call repeatedly. */
    @Transactional
    public PaymentHold ensureHoldForCompletedPayment(Payment payment) {
        Long requestId = payment.getRequest().getId();
        PaymentHold existing = paymentHoldRepository.findByRequestId(requestId).orElse(null);
        if (existing != null) return existing;
        Quote acceptedQuote = quoteRepository.findByRequestIdAndStatus(requestId, "accepted")
                .orElseThrow(() -> new BadRequestException("No accepted workshop quote found"));
        return paymentHoldRepository.save(PaymentHold.builder()
                .request(payment.getRequest())
                .customer(payment.getCustomer())
                .workshop(acceptedQuote.getWorkshop())
                .amount(payment.getAmount())
                .status("HELD")
                .build());
    }

    @Transactional
    public void markRefunded(Long requestId) {
        paymentHoldRepository.findByRequestId(requestId).ifPresent(hold -> {
            if ("RELEASED".equals(hold.getStatus())) {
                throw new BadRequestException("Released workshop funds cannot be refunded");
            }
            hold.setStatus("REFUNDED");
            hold.setRefundedAt(LocalDateTime.now());
            paymentHoldRepository.save(hold);
        });
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
