package com.tasaheel.service;

import com.tasaheel.dto.QuoteDTO;
import com.tasaheel.entity.MaintenanceRequest;
import com.tasaheel.entity.Quote;
import com.tasaheel.entity.ServiceType;
import com.tasaheel.entity.Workshop;
import com.tasaheel.event.EventPublisher;
import com.tasaheel.event.EventType;
import com.tasaheel.exception.BadRequestException;
import com.tasaheel.exception.ResourceNotFoundException;
import com.tasaheel.repository.MaintenanceRequestRepository;
import com.tasaheel.repository.QuoteRepository;
import com.tasaheel.repository.ServiceTypeRepository;
import com.tasaheel.repository.WorkshopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuoteService {

    private final QuoteRepository quoteRepository;
    private final MaintenanceRequestRepository requestRepository;
    private final WorkshopRepository workshopRepository;
    private final ServiceTypeRepository serviceTypeRepository;
    private final EventPublisher eventPublisher;

    public QuoteDTO submitQuote(Long requestId, Long workshopId, QuoteDTO dto) {
        MaintenanceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request", requestId));
        Workshop workshop = workshopRepository.findById(workshopId)
                .orElseThrow(() -> new ResourceNotFoundException("Workshop", workshopId));

        if (!List.of("pending", "quoted").contains(request.getStatus())) {
            throw new BadRequestException("Request is not open for quotes");
        }

        if (!quoteRepository.findByRequestIdAndWorkshopId(requestId, workshopId).isEmpty()) {
            throw new BadRequestException("Workshop has already submitted a quote for this request");
        }

        ServiceType serviceType = null;
        if (dto.getServiceTypeId() != null) {
            serviceType = serviceTypeRepository.findById(dto.getServiceTypeId())
                    .orElseThrow(() -> new ResourceNotFoundException("ServiceType", dto.getServiceTypeId()));
        }

        Quote quote = Quote.builder()
                .request(request)
                .workshop(workshop)
                .serviceType(serviceType)
                .price(dto.getPrice())
                .notes(dto.getNotes())
                .estimatedDays(dto.getEstimatedDays())
                .warrantyMonths(dto.getWarrantyMonths())
                .status("pending")
                .build();

        quote = quoteRepository.save(quote);

        if ("pending".equals(request.getStatus())) {
            request.setStatus("quoted");
            requestRepository.save(request);
        }

        Map<String, Object> eventData = new HashMap<>();
        eventData.put("quoteId", quote.getId());
        eventData.put("workshopId", workshop.getId());
        eventData.put("workshopName", workshop.getName());
        eventData.put("price", quote.getPrice());
        eventData.put("serviceTypeId", dto.getServiceTypeId());
        eventPublisher.publish(this, EventType.QUOTE_GENERATED, request.getId(), "workshop", workshop.getId(), eventData);

        return toQuoteDTO(quote);
    }

    public List<QuoteDTO> getQuotesByRequest(Long requestId) {
        return quoteRepository.findByRequestIdOrderByCreatedAtAsc(requestId).stream()
                .map(this::toQuoteDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void acceptQuote(Long quoteId, Long customerId) {
        Quote quote = quoteRepository.findById(quoteId)
                .orElseThrow(() -> new ResourceNotFoundException("Quote", quoteId));

        if (!quote.getStatus().equals("pending")) {
            throw new BadRequestException("Quote is already " + quote.getStatus());
        }

        quote.setStatus("accepted");
        quoteRepository.save(quote);

        List<Quote> allQuotes = quoteRepository.findByRequestIdOrderByCreatedAtAsc(quote.getRequest().getId());
        for (Quote q : allQuotes) {
            if (!q.getId().equals(quoteId) && q.getStatus().equals("pending")) {
                q.setStatus("rejected");
                quoteRepository.save(q);
                eventPublisher.publish(this, EventType.QUOTE_REJECTED, quote.getRequest().getId(), "customer", customerId,
                        Map.of("quoteId", q.getId(), "workshopId", q.getWorkshop().getId(),
                               "workshopName", q.getWorkshop().getName(), "price", q.getPrice()));
            }
        }

        MaintenanceRequest request = quote.getRequest();
        request.setStatus("accepted");
        requestRepository.save(request);

        eventPublisher.publish(this, EventType.OFFER_ACCEPTED, request.getId(), "customer", customerId,
                Map.of("quoteId", quoteId, "workshopId", quote.getWorkshop().getId(),
                       "workshopName", quote.getWorkshop().getName(), "price", quote.getPrice()));
    }

    public List<QuoteDTO> getWorkshopQuotes(Long workshopId) {
        return quoteRepository.findByWorkshopIdOrderByCreatedAtDesc(workshopId).stream()
                .map(this::toQuoteDTO)
                .collect(Collectors.toList());
    }

    private QuoteDTO toQuoteDTO(Quote quote) {
        return QuoteDTO.builder()
                .id(quote.getId())
                .requestId(quote.getRequest().getId())
                .workshopId(quote.getWorkshop().getId())
                .workshopName(quote.getWorkshop().getName())
                .workshopLogo(null)
                .serviceTypeId(quote.getServiceType() != null ? quote.getServiceType().getId() : null)
                .serviceTypeName(quote.getServiceType() != null ? quote.getServiceType().getName() : null)
                .price(quote.getPrice())
                .notes(quote.getNotes())
                .estimatedDays(quote.getEstimatedDays())
                .warrantyMonths(quote.getWarrantyMonths())
                .status(quote.getStatus())
                .createdAt(quote.getCreatedAt())
                .build();
    }
}
