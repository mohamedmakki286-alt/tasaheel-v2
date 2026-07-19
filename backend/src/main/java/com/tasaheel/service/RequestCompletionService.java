package com.tasaheel.service;

import com.tasaheel.entity.MaintenanceRequest;
import com.tasaheel.entity.RequestStatusHistory;
import com.tasaheel.repository.MaintenanceRequestRepository;
import com.tasaheel.repository.RequestStatusHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RequestCompletionService {
    private final MaintenanceRequestRepository requestRepository;
    private final RequestStatusHistoryRepository statusHistoryRepository;

    public void completeAfterPayment(MaintenanceRequest request, String paymentReference) {
        if ("completed".equals(request.getStatus())) return;
        request.setStatus("completed");
        requestRepository.save(request);
        statusHistoryRepository.save(RequestStatusHistory.builder()
                .request(request).status("completed")
                .notes("Invoice paid" + (paymentReference == null ? "" : " - " + paymentReference))
                .createdBy("payment_system").build());
    }
}
