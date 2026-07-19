package com.tasaheel.service;

import com.tasaheel.dto.CombinationOptionDTO;
import com.tasaheel.dto.CombinationServiceItemDTO;
import com.tasaheel.dto.SubOrderDTO;
import com.tasaheel.dto.SubOrderItemDTO;
import com.tasaheel.entity.*;
import com.tasaheel.event.EventPublisher;
import com.tasaheel.event.EventType;
import com.tasaheel.exception.BadRequestException;
import com.tasaheel.exception.ResourceNotFoundException;
import com.tasaheel.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SplitRequestService {

    private final MaintenanceRequestRepository requestRepository;
    private final QuoteRepository quoteRepository;
    private final WorkshopRepository workshopRepository;
    private final ServiceTypeRepository serviceTypeRepository;
    private final SubOrderRepository subOrderRepository;
    private final SubOrderItemRepository subOrderItemRepository;
    private final ServiceItemService serviceItemService;
    private final RequestStatusHistoryRepository statusHistoryRepository;
    private final EventPublisher eventPublisher;

    @Transactional
    public SubOrderDTO acceptBestPackage(Long requestId, Long customerId) {
        MaintenanceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request", requestId));

        if (!request.getCustomer().getId().equals(customerId)) {
            throw new BadRequestException("You are not the owner of this request");
        }

        if (!"quoted".equals(request.getStatus()) && !"offer_selected".equals(request.getStatus())) {
            throw new BadRequestException("Request is not in a selectable state");
        }

        List<Quote> acceptedQuotes = quoteRepository.findByRequestIdOrderByCreatedAtAsc(requestId).stream()
                .filter(q -> "pending".equals(q.getStatus()) && q.getServiceType() == null)
                .collect(Collectors.toList());

        if (acceptedQuotes.isEmpty()) {
            throw new BadRequestException("No bundle quotes available for this request");
        }

        Quote bestBundle = acceptedQuotes.stream()
                .min(Comparator.comparingDouble(Quote::getPrice))
                .orElseThrow(() -> new BadRequestException("No bundle quote found"));

        return splitFromQuote(request, bestBundle, customerId);
    }

    @Transactional
    public List<SubOrderDTO> acceptBestMix(Long requestId, Long customerId, CombinationOptionDTO mixOption) {
        MaintenanceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request", requestId));

        if (!request.getCustomer().getId().equals(customerId)) {
            throw new BadRequestException("You are not the owner of this request");
        }

        boolean canMix = "mobile".equals(request.getExecutionMethod()) || Boolean.TRUE.equals(request.getAllowMultiWorkshop());
        if (!canMix) {
            throw new BadRequestException("Multi-workshop split is not allowed for this request");
        }

        if (!"quoted".equals(request.getStatus()) && !"offer_selected".equals(request.getStatus())) {
            throw new BadRequestException("Request is not in a selectable state");
        }

        Map<Long, List<CombinationServiceItemDTO>> byWorkshop = mixOption.getItems().stream()
                .collect(Collectors.groupingBy(CombinationServiceItemDTO::getWorkshopId));

        List<SubOrder> subOrders = new ArrayList<>();

        for (Map.Entry<Long, List<CombinationServiceItemDTO>> entry : byWorkshop.entrySet()) {
            Long workshopId = entry.getKey();
            List<CombinationServiceItemDTO> items = entry.getValue();

            Workshop workshop = workshopRepository.findById(workshopId)
                    .orElseThrow(() -> new ResourceNotFoundException("Workshop", workshopId));

            double totalForWorkshop = items.stream()
                    .mapToDouble(i -> i.getPrice() != null ? i.getPrice() : 0.0)
                    .sum();

            SubOrder subOrder = SubOrder.builder()
                    .request(request)
                    .workshop(workshop)
                    .status("PENDING")
                    .totalPrice(totalForWorkshop)
                    .build();
            subOrder = subOrderRepository.save(subOrder);

            for (CombinationServiceItemDTO item : items) {
                ServiceType st = serviceTypeRepository.findById(item.getServiceTypeId())
                        .orElseThrow(() -> new ResourceNotFoundException("ServiceType", item.getServiceTypeId()));

                Quote quote = null;
                if (item.getQuoteId() != null) {
                    quote = quoteRepository.findById(item.getQuoteId()).orElse(null);
                }

                SubOrderItem subItem = SubOrderItem.builder()
                        .subOrder(subOrder)
                        .serviceType(st)
                        .quote(quote)
                        .status("PENDING")
                        .itemPrice(item.getPrice())
                        .build();
                subOrderItemRepository.save(subItem);

                serviceItemService.assignServiceTypeToWorkshop(requestId, st.getId(), workshopId);
            }

            subOrders.add(subOrder);
        }

        request.setStatus("splitted");
        requestRepository.save(request);

        createStatusHistory(request, "splitted", "Request split into " + subOrders.size() + " sub-orders", "customer:" + customerId);
        eventPublisher.publish(this, EventType.JOB_SPLIT_CREATED, requestId, "customer", customerId,
                Map.of("subOrderCount", subOrders.size()));

        return subOrders.stream().map(this::toDTO).collect(Collectors.toList());
    }

    private SubOrderDTO splitFromQuote(MaintenanceRequest request, Quote quote, Long customerId) {
        Workshop workshop = quote.getWorkshop();
        List<ServiceType> serviceTypes = request.getServiceTypes();

        SubOrder subOrder = SubOrder.builder()
                .request(request)
                .workshop(workshop)
                .status("ACCEPTED")
                .totalPrice(quote.getPrice())
                .build();
        subOrder = subOrderRepository.save(subOrder);

        quote.setStatus("accepted");
        quoteRepository.save(quote);

        List<Quote> others = quoteRepository.findByRequestIdOrderByCreatedAtAsc(request.getId());
        for (Quote q : others) {
            if (!q.getId().equals(quote.getId()) && "pending".equals(q.getStatus())) {
                q.setStatus("rejected");
                quoteRepository.save(q);
                eventPublisher.publish(this, EventType.QUOTE_REJECTED, request.getId(), "customer", customerId,
                        Map.of("quoteId", q.getId(), "workshopId", q.getWorkshop().getId(),
                               "workshopName", q.getWorkshop().getName(), "price", q.getPrice()));
            }
        }

        for (ServiceType st : serviceTypes) {
            SubOrderItem item = SubOrderItem.builder()
                    .subOrder(subOrder)
                    .serviceType(st)
                    .quote(quote)
                    .status("ACCEPTED")
                    .itemPrice(quote.getPrice() / serviceTypes.size())
                    .build();
            subOrderItemRepository.save(item);

            serviceItemService.assignServiceTypeToWorkshop(request.getId(), st.getId(), workshop.getId());
        }

        request.setStatus("accepted");
        requestRepository.save(request);

        createStatusHistory(request, "accepted", "Best package accepted from " + workshop.getName(),
                "customer:" + customerId);
        eventPublisher.publish(this, EventType.OFFER_ACCEPTED, request.getId(), "customer", customerId,
                Map.of("workshopId", workshop.getId(), "workshopName", workshop.getName(), "price", quote.getPrice()));

        return toDTO(subOrder);
    }

    private void createStatusHistory(MaintenanceRequest request, String status, String notes, String createdBy) {
        RequestStatusHistory history = RequestStatusHistory.builder()
                .request(request)
                .status(status)
                .notes(notes)
                .createdBy(createdBy)
                .build();
        statusHistoryRepository.save(history);
    }

    public List<SubOrderDTO> getSubOrders(Long requestId) {
        return subOrderRepository.findByRequestId(requestId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private SubOrderDTO toDTO(SubOrder subOrder) {
        List<SubOrderItem> items = subOrderItemRepository.findBySubOrderId(subOrder.getId());
        return SubOrderDTO.builder()
                .id(subOrder.getId())
                .requestId(subOrder.getRequest().getId())
                .workshopId(subOrder.getWorkshop().getId())
                .workshopName(subOrder.getWorkshop().getName())
                .status(subOrder.getStatus())
                .totalPrice(subOrder.getTotalPrice())
                .items(items.stream().map(i -> SubOrderItemDTO.builder()
                        .id(i.getId())
                        .subOrderId(i.getSubOrder().getId())
                        .serviceTypeId(i.getServiceType().getId())
                        .serviceTypeName(i.getServiceType().getName())
                        .quoteId(i.getQuote() != null ? i.getQuote().getId() : null)
                        .status(i.getStatus())
                        .itemPrice(i.getItemPrice())
                        .build()).collect(Collectors.toList()))
                .createdAt(subOrder.getCreatedAt())
                .build();
    }
}
