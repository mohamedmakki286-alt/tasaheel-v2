package com.tasaheel.integration;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.*;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@Service
@Slf4j
public class FirebaseService {

    @Value("${application.firebase.config-path}")
    private String firebaseConfigPath;

    @Value("${application.firebase.credentials-base64:}")
    private String firebaseCredentialsBase64;

    @Value("${application.firebase.credentials-json:}")
    private String firebaseCredentialsJson;

    @Value("${application.firebase.project-id:}")
    private String firebaseProjectId;

    private volatile boolean initialized;

    @PostConstruct
    public void initialize() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                GoogleCredentials credentials = loadCredentials();
                if (credentials == null) {
                    log.warn("Firebase credentials are not configured; push notifications are disabled");
                    return;
                }

                FirebaseOptions.Builder options = FirebaseOptions.builder().setCredentials(credentials);
                if (firebaseProjectId != null && !firebaseProjectId.isBlank()) {
                    options.setProjectId(firebaseProjectId.trim());
                }
                FirebaseApp.initializeApp(options.build());
            }
            initialized = !FirebaseApp.getApps().isEmpty();
            log.info("Firebase initialized successfully for project {}", firebaseProjectId);
        } catch (Exception e) {
            initialized = false;
            log.error("Failed to initialize Firebase: {}", e.getMessage());
        }
    }

    private GoogleCredentials loadCredentials() throws IOException {
        if (firebaseCredentialsBase64 != null && !firebaseCredentialsBase64.isBlank()) {
            byte[] decoded = Base64.getDecoder().decode(firebaseCredentialsBase64.replaceAll("\\s", ""));
            return GoogleCredentials.fromStream(new ByteArrayInputStream(decoded));
        }
        if (firebaseCredentialsJson != null && !firebaseCredentialsJson.isBlank()) {
            return GoogleCredentials.fromStream(new ByteArrayInputStream(
                    firebaseCredentialsJson.getBytes(StandardCharsets.UTF_8)));
        }
        ClassPathResource resource = new ClassPathResource("firebase-service-account.json");
        if (resource.exists()) {
            return GoogleCredentials.fromStream(resource.getInputStream());
        }
        try {
            return GoogleCredentials.getApplicationDefault();
        } catch (IOException ignored) {
            return null;
        }
    }

    public void sendNotification(String token, String title, String body, Map<String, String> data) {
        try {
            if (!initialized) {
                log.warn("Cannot send notification: Firebase is not initialized");
                return;
            }
            if (token == null || token.isEmpty()) {
                log.warn("Cannot send notification: token is null or empty");
                return;
            }

            Message.Builder messageBuilder = Message.builder()
                    .setToken(token)
                    .setAndroidConfig(createAndroidConfig())
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build());

            if (data != null && !data.isEmpty()) {
                messageBuilder.putAllData(data);
            }

            String response = FirebaseMessaging.getInstance().send(messageBuilder.build());
            log.debug("Notification sent successfully: {}", response);
        } catch (FirebaseMessagingException e) {
            log.error("Failed to send notification: {}", e.getMessage());
        }
    }

    public void sendToTopic(String topic, String title, String body, Map<String, String> data) {
        try {
            Message.Builder messageBuilder = Message.builder()
                    .setTopic(topic)
                    .setAndroidConfig(createAndroidConfig())
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build());

            if (data != null && !data.isEmpty()) {
                messageBuilder.putAllData(data);
            }

            String response = FirebaseMessaging.getInstance().send(messageBuilder.build());
            log.debug("Topic notification sent successfully: {}", response);
        } catch (FirebaseMessagingException e) {
            log.error("Failed to send topic notification: {}", e.getMessage());
        }
    }

    public void sendMulticastNotification(java.util.List<String> tokens, String title, String body, Map<String, String> data) {
        try {
            if (tokens == null || tokens.isEmpty()) {
                return;
            }

            MulticastMessage.Builder messageBuilder = MulticastMessage.builder()
                    .addAllTokens(tokens)
                    .setAndroidConfig(createAndroidConfig())
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build());

            if (data != null && !data.isEmpty()) {
                messageBuilder.putAllData(data);
            }

            BatchResponse response = FirebaseMessaging.getInstance().sendEachForMulticast(messageBuilder.build());
            log.debug("Multicast notification sent: {} success, {} failure",
                    response.getSuccessCount(), response.getFailureCount());
        } catch (FirebaseMessagingException e) {
            log.error("Failed to send multicast notification: {}", e.getMessage());
        }
    }

    private AndroidConfig createAndroidConfig() {
        return AndroidConfig.builder()
                .setPriority(AndroidConfig.Priority.HIGH)
                .setNotification(AndroidNotification.builder()
                        .setChannelId("tasaheel_alerts")
                        .setSound("default")
                        .build())
                .build();
    }
}
