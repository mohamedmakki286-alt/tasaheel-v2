package com.tasaheel.integration;

import com.tasaheel.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class MoyasarService {

    @Value("${application.moyasar.secret-key}")
    private String secretKey;

    @Value("${application.moyasar.base-url}")
    private String baseUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, Object> createHostedInvoice(double amount, String currency, String description,
                                                    String callbackUrl, String successUrl, String backUrl,
                                                    String reference) {
        try {
            HttpHeaders headers = createHeaders();
            Map<String, Object> body = new HashMap<>();
            body.put("amount", Math.round(amount * 100));
            body.put("currency", currency);
            body.put("description", description);
            body.put("callback_url", callbackUrl);
            body.put("success_url", successUrl);
            body.put("back_url", backUrl);
            body.put("metadata", Map.of("reference", reference));
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            return restTemplate.exchange(baseUrl + "/invoices", HttpMethod.POST, entity, Map.class).getBody();
        } catch (Exception e) {
            log.error("Failed to create hosted invoice: {}", e.getMessage());
            throw new BadRequestException("Failed to create payment checkout");
        }
    }

    public Map<String, Object> getInvoice(String invoiceId) {
        try {
            HttpEntity<Void> entity = new HttpEntity<>(createHeaders());
            return restTemplate.exchange(
                    baseUrl + "/invoices/" + invoiceId, HttpMethod.GET, entity, Map.class).getBody();
        } catch (Exception e) {
            log.error("Failed to fetch hosted invoice: {}", e.getMessage());
            throw new BadRequestException("Payment invoice not found");
        }
    }

    public Map<String, Object> refundPayment(String paymentId, double amount) {
        try {
            HttpHeaders headers = createHeaders();

            Map<String, Object> body = new HashMap<>();
            body.put("amount", (int) (amount * 100));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    baseUrl + "/payments/" + paymentId + "/refund",
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            return response.getBody();
        } catch (Exception e) {
            log.error("Failed to refund payment: {}", e.getMessage());
            throw new BadRequestException("Failed to refund payment: " + e.getMessage());
        }
    }

    public Map<String, Object> getPayment(String paymentId) {
        try {
            HttpHeaders headers = createHeaders();
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    baseUrl + "/payments/" + paymentId,
                    HttpMethod.GET,
                    entity,
                    Map.class
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("Failed to get payment: {}", e.getMessage());
            throw new BadRequestException("Payment not found");
        }
    }

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        String auth = secretKey + ":";
        byte[] encodedAuth = Base64.getEncoder().encode(auth.getBytes(StandardCharsets.UTF_8));
        headers.set("Authorization", "Basic " + new String(encodedAuth));
        headers.setAccept(java.util.List.of(MediaType.APPLICATION_JSON));
        headers.set(HttpHeaders.USER_AGENT, "Tasaheel-Backend/1.0 (+https://salabaa.com)");
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

}
