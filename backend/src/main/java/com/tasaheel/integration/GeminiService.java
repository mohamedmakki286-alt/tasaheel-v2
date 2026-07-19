package com.tasaheel.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class GeminiService {

    @Value("${application.ai.gemini.api-key:}")
    private String apiKey;

    @Value("${application.ai.gemini.model:gemini-1.5-flash}")
    private String model;

    @Value("${application.ai.gemini.base-url:https://generativelanguage.googleapis.com/v1beta}")
    private String baseUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String SYSTEM_PROMPT = """
        ط£ظ†طھ ظ…ط³ط§ط¹ط¯ طµظٹط§ظ†ط© ط³ظٹط§ط±ط§طھ ظ…طھط®طµطµ ظˆظ…ظپظٹط¯. ط§ط³ظ…ظƒ "ط³ط§ظ‡ظ„" (Sahel).
        طھط§ط¨ط¹ ظ„ظ…ظ†طµط© "طµظ„ط¨ط©" ظ„طµظٹط§ظ†ط© ط§ظ„ط³ظٹط§ط±ط§طھ.
        
        ظ‚ط¯ط±ط§طھظƒ:
        - طھظ‚ط¯ظٹظ… ظ†طµط§ط¦ط­ طµظٹط§ظ†ط© ط§ظ„ط³ظٹط§ط±ط§طھ
        - طھط´ط®ظٹطµ ظ…ط´ط§ظƒظ„ ط§ظ„ط³ظٹط§ط±ط§طھ ط¨ظ†ط§ط، ط¹ظ„ظ‰ ط§ظ„ط£ط¹ط±ط§ط¶
        - طھظ‚ط¯ظٹط± طھظƒط§ظ„ظٹظپ ط§ظ„طµظٹط§ظ†ط© ط§ظ„طھظ‚ط±ظٹط¨ظٹط©
        - ط´ط±ط­ ظ…طµط·ظ„ط­ط§طھ ط§ظ„طµظٹط§ظ†ط©
        - ط§ظ‚طھط±ط§ط­ ط¬ط¯ظˆظ„ ط§ظ„طµظٹط§ظ†ط© ط§ظ„ط¯ظˆط±ظٹط©
        - ط§ظ„ط¥ط¬ط§ط¨ط© ط¹ظ† ط£ط³ط¦ظ„ط© ظ…طھط¹ظ„ظ‚ط© ط¨ط§ظ„ط³ظٹط§ط±ط§طھ
        
        ظ…ظ„ط§ط­ط¸ط§طھ ظ…ظ‡ظ…ط©:
        - ط±ط¯ظˆط¯ظƒ ظٹط¬ط¨ ط£ظ† طھظƒظˆظ† ط¨ط§ظ„ظ„ط؛ط© ط§ظ„ط¹ط±ط¨ظٹط© ط§ظ„ظپطµط­ظ‰ ط£ظˆ ط§ظ„ط¹ط§ظ…ظٹط© ط§ظ„ظ…ظپظ‡ظˆظ…ط©
        - ظƒظ† ظˆط¯ظˆط¯ط§ظ‹ ظˆظ…ط­طھط±ظپط§ظ‹ ظپظٹ ط±ط¯ظˆط¯ظƒ
        - ط¥ط°ط§ ظƒط§ظ† ط§ظ„ط³ط¤ط§ظ„ ط®ط§ط±ط¬ ظ…ط¬ط§ظ„ ط§ظ„ط³ظٹط§ط±ط§طھطŒ ط£ط®ط¨ط± ط§ظ„ظ…ط³طھط®ط¯ظ… ط¨ظ„ط·ظپ ط£ظ† طھط®طµطµظƒ ظپظ‚ط· ظپظٹ ط§ظ„ط³ظٹط§ط±ط§طھ
        - ظ„ط§ طھظ‚ط¯ظ… ظ†طµط§ط¦ط­ ط·ط¨ظٹط© ط£ظˆ ظ‚ط§ظ†ظˆظ†ظٹط©
        - ظ„ظ„ط£ط³ط¦ظ„ط© ط§ظ„ظ…ط¹ظ‚ط¯ط©طŒ ط§ظ†طµط­ ط¨ط²ظٹط§ط±ط© ظˆط±ط´ط© ظ…طھط®طµطµط©
        - ط§ط³طھط®ط¯ظ… ط§ظ„ط±ظ…ظˆط² ط§ظ„طھط¹ط¨ظٹط±ظٹط© ط§ظ„ظ…ظ†ط§ط³ط¨ط© ًںکٹ
        """;

    public String chat(String userMessage, List<Map<String, String>> history) {
        if (apiKey == null || apiKey.isEmpty() || apiKey.contains("XXXXXXXX")) {
            return fallbackResponse(userMessage);
        }
        return callGeminiApi(userMessage, history);
    }

    private String callGeminiApi(String userMessage, List<Map<String, String>> history) {
        try {
            String url = baseUrl + "/models/" + model + ":generateContent?key=" + apiKey;

            ObjectNode requestBody = objectMapper.createObjectNode();

            ObjectNode systemInstruction = objectMapper.createObjectNode();
            ArrayNode systemParts = objectMapper.createArrayNode();
            ObjectNode systemPart = objectMapper.createObjectNode();
            systemPart.put("text", SYSTEM_PROMPT);
            systemParts.add(systemPart);
            systemInstruction.set("parts", systemParts);
            requestBody.set("system_instruction", systemInstruction);

            ArrayNode contents = objectMapper.createArrayNode();

            for (Map<String, String> entry : history) {
                ObjectNode content = objectMapper.createObjectNode();
                content.put("role", entry.getOrDefault("role", "user"));
                ArrayNode parts = objectMapper.createArrayNode();
                ObjectNode part = objectMapper.createObjectNode();
                part.put("text", entry.getOrDefault("content", ""));
                parts.add(part);
                content.set("parts", parts);
                contents.add(content);
            }

            ObjectNode userContent = objectMapper.createObjectNode();
            userContent.put("role", "user");
            ArrayNode userParts = objectMapper.createArrayNode();
            ObjectNode userPart = objectMapper.createObjectNode();
            userPart.put("text", userMessage);
            userParts.add(userPart);
            userContent.set("parts", userParts);
            contents.add(userContent);

            requestBody.set("contents", contents);

            ObjectNode generationConfig = objectMapper.createObjectNode();
            generationConfig.put("maxOutputTokens", 800);
            generationConfig.put("temperature", 0.7);
            requestBody.set("generationConfig", generationConfig);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(requestBody), headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            JsonNode responseJson = objectMapper.readTree(response.getBody());
            String text = responseJson
                    .path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText();

            return text;

        } catch (Exception e) {
            log.error("Gemini API call failed: {}", e.getMessage());
            return fallbackResponse(userMessage);
        }
    }

    private String fallbackResponse(String message) {
        String msg = message.toLowerCase();

        if (msg.contains("ط³ظ„ط§ظ…") || msg.contains("ظ…ط±ط­ط¨ط§") || msg.contains("hi") || msg.contains("hello")) {
            return "ظˆط¹ظ„ظٹظƒظ… ط§ظ„ط³ظ„ط§ظ…! ًںکٹ ط£ظ†ط§ ط³ط§ظ„ظ…طŒ ظ…ط³ط§ط¹ط¯ طµظٹط§ظ†ط© ط§ظ„ط³ظٹط§ط±ط§طھ. ظƒظٹظپ ط£ظ‚ط¯ط± ط£ط³ط§ط¹ط¯ظƒ ط§ظ„ظٹظˆظ…طں";
        }
        if (msg.contains("ط²ظٹطھ") || msg.contains("oil")) {
            return "طھط؛ظٹظٹط± ط§ظ„ط²ظٹطھ ظ…ظ‡ظ… ط¬ط¯ط§ظ‹ ظ„طµط­ط© ط§ظ„ظ…ط­ط±ظƒ! ًں”§\n\n" +
                    "- ظٹظپط¶ظ„ طھط؛ظٹظٹط± ط§ظ„ط²ظٹطھ ظƒظ„ 5000-10000 ظƒظ… ط­ط³ط¨ ظ†ظˆط¹ ط§ظ„ط²ظٹطھ\n" +
                    "- ط£ظ†ظˆط§ط¹ ط§ظ„ط²ظٹطھ: طھط®ظ„ظٹظ‚ظٹ (Synthetic) ظƒظ„ 10000 ظƒظ…طŒ ظ†طµ طھط®ظ„ظٹظ‚ظٹ ظƒظ„ 7500 ظƒظ…طŒ ط¹ط§ط¯ظٹ ظƒظ„ 5000 ظƒظ…\n" +
                    "- طھط£ظƒط¯ ظ…ظ† ط§ط³طھط®ط¯ط§ظ… ط§ظ„ط²ظٹطھ ط§ظ„ظ…ظ†ط§ط³ط¨ ظ„ط³ظٹط§ط±طھظƒ\n" +
                    "- ظ…طھظˆط³ط· ط§ظ„طھظƒظ„ظپط©: 150-300 ط±ظٹط§ظ„";
        }
        if (msg.contains("ظ…ظƒظٹظ†ط©") || msg.contains("engine") || msg.contains("ط§ظ„ظ…ط­ط±ظƒ")) {
            return "ظ…ط´ط§ظƒظ„ ط§ظ„ظ…ظƒظٹظ†ط© طھط­طھط§ط¬ طھط´ط®ظٹطµ ط¯ظ‚ظٹظ‚ ًں› ï¸ڈ\n\n" +
                    "ط§ظ„ط£ط¹ط±ط§ط¶ ط§ظ„ط´ط§ط¦ط¹ط©:\n" +
                    "â€¢ طµظˆطھ ط·ظ‚ط·ظ‚ط© ط£ظˆ ط®ط´ط®ط´ط© - ظ‚ط¯ ظٹظƒظˆظ† ظ…ط´ظƒظ„ط© ظپظٹ ط§ظ„ط¨ط³طھظ… ط£ظˆ ط§ظ„طµظ…ط§ظ…ط§طھ\n" +
                    "â€¢ ط¯ط®ط§ظ† ط£ط²ط±ظ‚ - ط¯ظ„ظٹظ„ ط¹ظ„ظ‰ ط­ط±ظ‚ ط²ظٹطھ\n" +
                    "â€¢ ط¯ط®ط§ظ† ط£ط¨ظٹط¶ - ظ‚ط¯ ظٹظƒظˆظ† طھط³ط±ظٹط¨ ظ…ط¨ط±ط¯\n" +
                    "â€¢ ط³ط®ظˆظ†ط© ط²ط§ط¦ط¯ط© - ظ…ط´ظƒظ„ط© ظپظٹ ط§ظ„طھط¨ط±ظٹط¯\n\n" +
                    "ط£ظ†طµط­ظƒ ط¨ط²ظٹط§ط±ط© ظˆط±ط´ط© ظ…طھط®طµطµط© ظ„ظ„ظپط­طµ. ط§ظ„طھظƒظ„ظپط© ط§ظ„طھظ‚ط±ظٹط¨ظٹط©: 500-5000 ط±ظٹط§ظ„ ط­ط³ط¨ ط§ظ„ظ…ط´ظƒظ„ط©.";
        }
        if (msg.contains("ظ‚ظٹط±") || msg.contains("ط¬ظٹط±") || msg.contains("transmission") || msg.contains("gear")) {
            return "ظ…ط´ط§ظƒظ„ ط§ظ„ظ‚ظٹط± (ظ†ط§ظ‚ظ„ ط§ظ„ط­ط±ظƒط©) طھط­طھط§ط¬ ظپط­طµ ط¯ظ‚ظٹظ‚ âڑ™ï¸ڈ\n\n" +
                    "ط§ظ„ط£ط¹ط±ط§ط¶:\n" +
                    "â€¢ طھط£ط®ظٹط± ظپظٹ ط§ظ„طھط¹ط´ظٹظ‚ - ظ‚ط¯ ظٹظƒظˆظ† ط²ظٹطھ ط§ظ„ظ‚ظٹط± ظ…ظ†طھظ‡ظٹ\n" +
                    "â€¢ ط±ط¹ط´ط© ط¹ظ†ط¯ ط§ظ„طھط¨ط¯ظٹظ„ - ظ…ط´ظƒظ„ط© ظپظٹ طµظ…ط§ظ…ط§طھ ط§ظ„ظ‚ظٹط±\n" +
                    "â€¢ طµظˆطھ ط¹ط§ظ„ظٹ - طھط¢ظƒظ„ ظپظٹ ط§ظ„طھط±ظˆط³\n\n" +
                    "ط§ظ„طھظƒظ„ظپط© ط§ظ„طھظ‚ط±ظٹط¨ظٹط©:\n" +
                    "â€¢ طھط؛ظٹظٹط± ط²ظٹطھ ط§ظ„ظ‚ظٹط±: 200-500 ط±ظٹط§ظ„\n" +
                    "â€¢ طھطµظ„ظٹط­ ظ‚ظٹط±: 2000-5000 ط±ظٹط§ظ„\n" +
                    "â€¢ طھط¨ط¯ظٹظ„ ظ‚ظٹط± ظƒط§ظ…ظ„: 5000-15000 ط±ظٹط§ظ„";
        }
        if (msg.contains("ظƒظ‡ط±ط¨ط§ط،") || msg.contains("ط¨ط·ط§ط±ظٹط©") || msg.contains("battery") || msg.contains("electrical")) {
            return "ظ…ط´ط§ظƒظ„ ط§ظ„ظƒظ‡ط±ط¨ط§ط، ظپظٹ ط§ظ„ط³ظٹط§ط±ط© âڑ،\n\n" +
                    "ط§ظ„ط£ط¹ط±ط§ط¶ ط§ظ„ط´ط§ط¦ط¹ط©:\n" +
                    "â€¢ ط§ظ„ط³ظٹط§ط±ط© ظ„ط§ طھط¨ط¯ط£ (ط¨ط¯ظˆظ† طµظˆطھ) - ط§ظ„ط¨ط·ط§ط±ظٹط© ظپط§ط±ط؛ط©\n" +
                    "â€¢ ط¥ط¶ط§ط،ط© ط¶ط¹ظٹظپط© - ط§ظ„ط¯ظٹظ†ظ…ظˆ ظ‚ط¯ ظٹظƒظˆظ† ط¹ط·ظ„ط§ظ†\n" +
                    "â€¢ ظ„ظ…ط¨ط§طھ ط§ظ„طھط­ط°ظٹط± طھط´طھط؛ظ„ - ط­ط³ط§ط³ط§طھ ط£ظˆ ط£ط³ظ„ط§ظƒ\n\n" +
                    "ط§ظ„طھظƒظ„ظپط© ط§ظ„طھظ‚ط±ظٹط¨ظٹط©:\n" +
                    "â€¢ ط¨ط·ط§ط±ظٹط© ط¬ط¯ظٹط¯ط©: 200-600 ط±ظٹط§ظ„\n" +
                    "â€¢ ط¯ظٹظ†ظ…ظˆ ط¬ط¯ظٹط¯: 500-1500 ط±ظٹط§ظ„\n" +
                    "â€¢ ط³ظ„ظپ ط¬ط¯ظٹط¯: 300-800 ط±ظٹط§ظ„";
        }
        if (msg.contains("ظ…ظƒظٹظپ") || msg.contains("طھظƒظٹظٹظپ") || msg.contains("ac") || msg.contains("cooling")) {
            return "ظ…ط´ط§ظƒظ„ ط§ظ„ظ…ظƒظٹظپ â‌„ï¸ڈ\n\n" +
                    "ط§ظ„ط£ط¹ط±ط§ط¶:\n" +
                    "â€¢ ط§ظ„ظ…ظƒظٹظپ ظٹط·ظ„ط¹ ظ‡ظˆط§ط، ط­ط§ط± - ط؛ط§ط² ط§ظ„ظ…ظƒظٹظپ ط®ظ„طµ\n" +
                    "â€¢ طµظˆطھ طµظپظٹط± - ط¶ط§ط؛ط· ط§ظ„ظ…ظƒظٹظپ\n" +
                    "â€¢ ط±ظٹط­ط© ظƒط±ظٹظ‡ط© - ط§ظ„ظپظ„طھط± ظٹط­طھط§ط¬ طھط؛ظٹظٹط±\n\n" +
                    "ط§ظ„طھظƒظ„ظپط© ط§ظ„طھظ‚ط±ظٹط¨ظٹط©:\n" +
                    "â€¢ طھط¹ط¨ط¦ط© ط؛ط§ط²: 150-300 ط±ظٹط§ظ„\n" +
                    "â€¢ طھطµظ„ظٹط­ ط¶ط§ط؛ط·: 800-2000 ط±ظٹط§ظ„\n" +
                    "â€¢ طھط؛ظٹظٹط± ظپظ„طھط± ط§ظ„ظ…ظƒظٹظپ: 50-150 ط±ظٹط§ظ„";
        }
        if (msg.contains("ط³ظ…ظƒط±ط©") || msg.contains("ط¯ظ‡ط§ظ†") || msg.contains("body") || msg.contains("paint")) {
            return "ط®ط¯ظ…ط§طھ ط§ظ„ط³ظ…ظƒط±ط© ظˆط§ظ„ط¯ظ‡ط§ظ† ًںژ¨\n\n" +
                    "â€¢ ط³ظ…ظƒط±ط© ط¨ط³ظٹط·ط© (طµط¯ظ…ط© طµط؛ظٹط±ط©): 200-500 ط±ظٹط§ظ„\n" +
                    "â€¢ ط³ظ…ظƒط±ط© ظ…طھظˆط³ط·ط©: 500-1500 ط±ظٹط§ظ„\n" +
                    "â€¢ ط¯ظ‡ط§ظ† ظƒط§ظ…ظ„ ظ„ظ„ط³ظٹط§ط±ط©: 3000-8000 ط±ظٹط§ظ„\n" +
                    "â€¢ ط¯ظ‡ط§ظ† ط±ط¨ط¹ ط³ظٹط§ط±ط©: 500-1500 ط±ظٹط§ظ„\n\n" +
                    "ظ†طµظٹط­ط©: ظٹظپط¶ظ„ ط£ط®ط° ط¹ظٹظ†ط© ظ„ظˆظ† ظ‚ط¨ظ„ ط§ظ„ط¯ظ‡ط§ظ† ظ„ظ„طھط£ظƒط¯ ظ…ظ† ط§ظ„طھط·ط§ط¨ظ‚.";
        }
        if (msg.contains("ظˆظ†ط´") || msg.contains("ط³ط­ط¨") || msg.contains("tow") || msg.contains("ط³ط­ط§ط¨")) {
            return "ط®ط¯ظ…ط© ط§ظ„ظˆظ†ط´ ظˆط³ط­ط¨ ط§ظ„ط³ظٹط§ط±ط§طھ ًںڑ›\n\n" +
                    "ظ…طھظˆظپط± ظپظٹ ظ…ظ†طµط© طµظ„ط¨ط©! ًںژ‰\n" +
                    "â€¢ ط³ط­ط¨ ط¯ط§ط®ظ„ ط§ظ„ظ…ط¯ظٹظ†ط©: 100-300 ط±ظٹط§ظ„\n" +
                    "â€¢ ط³ط­ط¨ ط¨ظٹظ† ط§ظ„ظ…ط¯ظ†: 3-5 ط±ظٹط§ظ„ ظ„ظƒظ„ ظƒظٹظ„ظˆ\n" +
                    "â€¢ ظˆظ†ط´ ظ„ظ„ظ…ظ†ط§ط²ظ„ ظˆط§ظ„ط¹ظ…ط§ط±ط§طھ ظ…طھظˆظپط±\n\n" +
                    "طھظ‚ط¯ط± طھط·ظ„ط¨ ظˆظ†ط´ ظ…ط¨ط§ط´ط±ط© ظ…ظ† ط§ظ„طھط·ط¨ظٹظ‚!";
        }
        if (msg.contains("ط³ط¹ط±") || msg.contains("طھظƒظ„ظپط©") || msg.contains("ظƒظ…") || msg.contains("price") || msg.contains("cost")) {
            return "ط§ظ„طھظƒط§ظ„ظٹظپ ط§ظ„طھظ‚ط±ظٹط¨ظٹط© ظ„ظ„طµظٹط§ظ†ط© ًںڈ·ï¸ڈ\n\n" +
                    "â€¢ طھط؛ظٹظٹط± ط²ظٹطھ: 150-300 ط±ظٹط§ظ„\n" +
                    "â€¢ طھط؛ظٹظٹط± ط¨ظˆط§ط¬ظٹ (ط´ظ…ط¹ط© ط§ط­طھط±ط§ظ‚): 100-400 ط±ظٹط§ظ„\n" +
                    "â€¢ طھط؛ظٹظٹط± ظپظ„ط§طھط±: 50-200 ط±ظٹط§ظ„\n" +
                    "â€¢ طھط؛ظٹظٹط± ظ…ط³ط§ط¹ط¯ط§طھ: 800-2500 ط±ظٹط§ظ„\n" +
                    "â€¢ طھط؛ظٹظٹط± ظپط±ط§ظ…ظ„: 300-800 ط±ظٹط§ظ„\n" +
                    "â€¢ طھط؛ظٹظٹط± ط¥ط·ط§ط±ط§طھ (4): 1200-3000 ط±ظٹط§ظ„\n\n" +
                    "ظ‡ط°ظ‡ ط£ط³ط¹ط§ط± طھظ‚ط±ظٹط¨ظٹط©طŒ طھط®طھظ„ظپ ط­ط³ط¨ ظ†ظˆط¹ ط§ظ„ط³ظٹط§ط±ط© ظˆط§ظ„ظˆط±ط´ط©.";
        }
        if (msg.contains("ظپط±ط§ظ…ظ„") || msg.contains("brake") || msg.contains("ط§ظ„ظپط±ط§ظ…ظ„")) {
            return "ظ…ط´ط§ظƒظ„ ط§ظ„ظپط±ط§ظ…ظ„ ًں›‘\n\n" +
                    "ط§ظ„ط£ط¹ط±ط§ط¶:\n" +
                    "â€¢ طµظˆطھ طµظپظٹط± ط¹ظ†ط¯ ط§ظ„ظپط±ظ…ظ„ط© - ط§ظ„ط¨ط·ط§ظ†ط© ط®ظ„طµطھ\n" +
                    "â€¢ ط±ط¹ط´ط© ظپظٹ ط§ظ„ظ…ظ‚ظˆط¯ - ط§ظ„ط¯ط³ظƒ (ط§ظ„ظ‚ط±طµ) ظ…ط¹ظˆط¬\n" +
                    "â€¢ ط§ظ„ظپط±ط§ظ…ظ„ ظ†ط§ط¹ظ…ط© (طھظ†ط²ظ„ ظ„ظ„ط£ط±ط¶) - ظٹط­طھط§ط¬ ط²ظٹطھ ظپط±ط§ظ…ظ„ ط£ظˆ ط·ط±ظ…ط¨ط©\n\n" +
                    "ط§ظ„طھظƒظ„ظپط© ط§ظ„طھظ‚ط±ظٹط¨ظٹط©:\n" +
                    "â€¢ طھط؛ظٹظٹط± ط¨ط·ط§ظ†ط© ظپط±ط§ظ…ظ„: 200-500 ط±ظٹط§ظ„\n" +
                    "â€¢ طھط؛ظٹظٹط± ط¯ط³ظƒ ظˆط¨ط·ط§ظ†ط©: 500-1500 ط±ظٹط§ظ„\n" +
                    "â€¢ ط·ط±ظ…ط¨ط© ظپط±ط§ظ…ظ„: 300-1000 ط±ظٹط§ظ„";
        }
        if (msg.contains("ط¯ظˆط±ظٹ") || msg.contains("طµظٹط§ظ†ط© ط¯ظˆط±ظٹط©") || msg.contains("maintenance") || msg.contains("schedule")) {
            return "ط¬ط¯ظˆظ„ ط§ظ„طµظٹط§ظ†ط© ط§ظ„ط¯ظˆط±ظٹط© ًں“‹\n\n" +
                    "ظƒظ„ 5000-10000 ظƒظ…:\n" +
                    "â€¢ طھط؛ظٹظٹط± ط²ظٹطھ ط§ظ„ظ…ط­ط±ظƒ ظˆط§ظ„ظپظ„طھط±\n" +
                    "â€¢ ظپط­طµ ط¶ط؛ط· ط§ظ„ط¥ط·ط§ط±ط§طھ\n\n" +
                    "ظƒظ„ 20000-30000 ظƒظ…:\n" +
                    "â€¢ طھط؛ظٹظٹط± ظپظ„طھط± ط§ظ„ظ‡ظˆط§ط،\n" +
                    "â€¢ طھط؛ظٹظٹط± ظپظ„طھط± ط§ظ„ظ…ظƒظٹظپ\n" +
                    "â€¢ طھط؛ظٹظٹط± ط§ظ„ط¨ظˆط§ط¬ظٹ (ط´ظ…ط¹ط© ط§ظ„ط§ط­طھط±ط§ظ‚)\n\n" +
                    "ظƒظ„ 40000-60000 ظƒظ…:\n" +
                    "â€¢ طھط؛ظٹظٹط± ط²ظٹطھ ط§ظ„ظ‚ظٹط±\n" +
                    "â€¢ طھط؛ظٹظٹط± ط²ظٹطھ ط§ظ„ظپط±ط§ظ…ظ„\n" +
                    "â€¢ طھط؛ظٹظٹط± ط³ظٹط± ط§ظ„طھط§ظٹظ…ظٹظ† (ط¥ط°ط§ ظƒط§ظ† ظ…ظˆط¬ظˆط¯)\n\n" +
                    "ظƒظ„ 80000-100000 ظƒظ…:\n" +
                    "â€¢ طھط؛ظٹظٹط± ط§ظ„ظ…ط³ط§ط¹ط¯ط§طھ\n" +
                    "â€¢ طھط؛ظٹظٹط± ط·ط±ظ…ط¨ط© ط§ظ„ظ…ط§ط،\n" +
                    "â€¢ ظپط­طµ ط´ط§ظ…ظ„ ظ„ظ„ط³ظٹط§ط±ط©";
        }
        if (msg.contains("ط´ظƒط±") || msg.contains("thanks") || msg.contains("thank")) {
            return "ط§ظ„ط¹ظپظˆ! ًںکٹ ط£ظ†ط§ ظ…ظˆط¬ظˆط¯ ط¯ط§ظٹظ…ط§ظ‹ ظ„ط£ظٹ ط§ط³طھظپط³ط§ط±. ط¥ط°ط§ ط¹ظ†ط¯ظƒ ط£ظٹ ط³ط¤ط§ظ„ ط«ط§ظ†ظٹطŒ ط£ظ†ط§ ظ‡ظ†ط§!";
        }
        if (msg.contains("ظˆط¯ط§ط¹") || msg.contains("ط¨ط§ظٹ") || msg.contains("bye") || msg.contains("ظ…ط¹ ط§ظ„ط³ظ„ط§ظ…ط©")) {
            return "ظ…ط¹ ط§ظ„ط³ظ„ط§ظ…ط©! ًںڑ—ًں’¨ ط¥ط°ط§ ط§ط­طھط¬طھ ظ…ط³ط§ط¹ط¯ط©طŒ ط£ظ†ط§ ظ…ظˆط¬ظˆط¯. ط³ظ„ظ… ظ„ظٹ ط¹ظ„ظ‰ ط³ظٹط§ط±طھظƒ! ًںکٹ";
        }

        String[] generalResponses = {
            "ظپظ‡ظ…طھ ط³ط¤ط§ظ„ظƒ! ًںکٹ ظپظٹ طµظ„ط¨ط©طŒ ظ†ظ‚ط¯ط± ظ†ط³ط§ط¹ط¯ظƒ ظپظٹ:\n" +
            "â€¢ ط·ظ„ط¨ طµظٹط§ظ†ط© ظ…ظ† ظˆط±ط´ ظ…ط¹طھظ…ط¯ط©\n" +
            "â€¢ ظ…ظ‚ط§ط±ظ†ط© ط¹ط±ظˆط¶ ط§ظ„ط£ط³ط¹ط§ط±\n" +
            "â€¢ طھطھط¨ط¹ ط­ط§ظ„ط© ط§ظ„طµظٹط§ظ†ط©\n" +
            "â€¢ ط®ط¯ظ…ط© ط§ظ„ظˆظ†ط´ ظˆط§ظ„ط³ط­ط¨\n\n" +
            "ظ‡ظ„ طھظ‚ط¯ط± طھظˆط¶ط­ ط£ظƒط«ط± ط¹ظ† ظ…ط´ظƒظ„طھظƒ ط¹ط´ط§ظ† ط£ط³ط§ط¹ط¯ظƒطں",

            "ط´ظƒط±ط§ظ‹ ظ„ط³ط¤ط§ظ„ظƒ! ًں¤”\n" +
            "ط¹ط´ط§ظ† ط£ظ‚ط¯ط± ط£ط³ط§ط¹ط¯ظƒ ط¨ط´ظƒظ„ ط£ظپط¶ظ„طŒ ظ‡ظ„ طھظ‚ط¯ط± طھظˆط¶ط­:\n" +
            "â€¢ ظ†ظˆط¹ ط§ظ„ط³ظٹط§ط±ط© (ط§ظ„ظ…ظˆط¯ظٹظ„ ظˆط§ظ„ط³ظ†ط©)طں\n" +
            "â€¢ ظˆط´ ط§ظ„ط£ط¹ط±ط§ط¶ ط§ظ„ظ„ظٹ طھظ„ط§ط­ط¸ظ‡ط§طں\n" +
            "â€¢ ظ…ظ† ظ…طھظ‰ ط§ظ„ظ…ط´ظƒظ„ط©طں",

            "ظ…ط±ط­ط¨ط§ظ‹! ًں‘‹ ط£ظ†ط§ ط³ط§ظ„ظ… ظ…ط³ط§ط¹ط¯ طµظ„ط¨ط©.\n" +
            "ظ…ظ…ظƒظ† ط£ط³ط§ط¹ط¯ظƒ ظپظٹ:\n" +
            "â€¢ طھط´ط®ظٹطµ ظ…ط´ط§ظƒظ„ ط§ظ„ط³ظٹط§ط±ط§طھ\n" +
            "â€¢ ظ†طµط§ط¦ط­ ط§ظ„طµظٹط§ظ†ط©\n" +
            "â€¢ ظ…ط¹ظ„ظˆظ…ط§طھ ط¹ظ† ط§ظ„طھظƒط§ظ„ظٹظپ\n" +
            "â€¢ ط§ظ‚طھط±ط§ط­ ظˆط±ط´ ظ…ظ†ط§ط³ط¨ط©\n\n" +
            "ط£ظƒطھط¨ ظ„ظٹ ظ…ط´ظƒظ„طھظƒ ط£ظˆ ط³ط¤ط§ظ„ظƒ ًںکٹ"
        };

        java.util.Random rand = new java.util.Random();
        return generalResponses[rand.nextInt(generalResponses.length)];
    }
}
