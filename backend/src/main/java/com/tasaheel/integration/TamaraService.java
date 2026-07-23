package com.tasaheel.integration;

import com.tasaheel.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class TamaraService {

    @Value("${application.tamara.api-url:https://api.tamara.co}")
    private String apiUrl;

    @Value("${application.tamara.api-key:}")
    private String apiKey;

    @Value("${application.tamara.notification-token:}")
    private String notificationToken;

    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, Object> initiateCheckout(double amount, String currency, String orderId,
                                                 String customerName, String customerEmail, String customerPhone,
                                                 String successUrl, String failureUrl, String cancelUrl) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + apiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> order = new HashMap<>();
            order.put("order_id", orderId);
            order.put("total_amount", Map.of("amount", String.valueOf(amount), "currency", currency));
            order.put("description", "Payment for order " + orderId);
            order.put("country", "SA");
            order.put("payment_type", "PAY_BY_INSTALMENTS");

            Map<String, Object> consumer = new HashMap<>();
            consumer.put("first_name", customerName);
            consumer.put("email", customerEmail);
            consumer.put("phone_number", customerPhone);
            order.put("consumer", consumer);

            Map<String, Object> urls = new HashMap<>();
            urls.put("success_url", successUrl);
            urls.put("failure_url", failureUrl);
            urls.put("cancel_url", cancelUrl);
            order.put("merchant_url", urls);

            if (!notificationToken.isEmpty()) {
                order.put("notification_token", notificationToken);
            }

            Map<String, Object> body = new HashMap<>();
            body.put("order", order);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    apiUrl + "/checkout",
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK || response.getStatusCode() == HttpStatus.CREATED) {
                return response.getBody();
            }
            throw new BadRequestException("Tamara checkout failed: " + response.getStatusCode());
        } catch (Exception e) {
            log.error("Failed to initiate Tamara checkout: {}", e.getMessage());
            throw new BadRequestException("Failed to initiate Tamara checkout: " + e.getMessage());
        }
    }

    public Map<String, Object> getPaymentStatus(String orderId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + apiKey);

            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    apiUrl + "/orders/" + orderId,
                    HttpMethod.GET,
                    entity,
                    Map.class
            );

            return response.getBody();
        } catch (Exception e) {
            log.error("Failed to get Tamara order status: {}", e.getMessage());
            throw new BadRequestException("Unable to verify Tamara order");
        }
    }

    public Map<String, Object> handleWebhook(Map<String, Object> payload) {
        return payload;
    }
}
