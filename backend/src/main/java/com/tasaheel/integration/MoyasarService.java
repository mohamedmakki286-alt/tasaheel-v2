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

    public Map<String, Object> initiatePayment(double amount, String currency, String description, String callbackUrl) {
        return initiatePayment(amount, currency, description, callbackUrl, null);
    }

    public Map<String, Object> initiatePayment(double amount, String currency, String description, String callbackUrl, String sourceType) {
        try {
            HttpHeaders headers = createHeaders();

            Map<String, Object> body = new HashMap<>();
            body.put("amount", (int) (amount * 100));
            body.put("currency", currency);
            body.put("description", description);
            body.put("callback_url", callbackUrl);

            if (sourceType != null) {
                Map<String, Object> source = new HashMap<>();
                source.put("type", sourceType);
                body.put("source", source);
            }

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    baseUrl + "/payments",
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            return response.getBody();
        } catch (Exception e) {
            log.error("Failed to initiate payment: {}", e.getMessage());
            throw new BadRequestException("Failed to initiate payment: " + e.getMessage());
        }
    }

    public Map<String, Object> handleWebhook(String payload) {
        try {
            Map<String, Object> webhookData = restTemplate.getForObject(
                    baseUrl + "/payments/" + extractPaymentId(payload),
                    Map.class
            );
            return webhookData;
        } catch (Exception e) {
            log.error("Failed to handle webhook: {}", e.getMessage());
            throw new BadRequestException("Invalid webhook payload");
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
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    private String extractPaymentId(String payload) {
        try {
            Map<String, Object> map = restTemplate.getForObject(
                    baseUrl + "/payments",
                    Map.class
            );
            return "";
        } catch (Exception e) {
            return "";
        }
    }
}
