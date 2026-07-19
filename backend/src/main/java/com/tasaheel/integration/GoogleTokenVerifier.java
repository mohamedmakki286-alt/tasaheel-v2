package com.tasaheel.integration;

import com.tasaheel.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@Slf4j
public class GoogleTokenVerifier {

    private static final String USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";
    private static final String EXPECTED_AUDIENCE = "240378879505-5mcamdg4gk18lh9cmaiigbfoo9e2oe28";

    private final RestTemplate restTemplate;

    public GoogleTokenVerifier() {
        this.restTemplate = new RestTemplate();
    }

    public Map<String, Object> verify(String accessToken, String expectedSub, String expectedEmail) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            HttpEntity<?> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(USERINFO_URL, HttpMethod.GET, entity, Map.class);
            Map<String, Object> body = response.getBody();
            if (body == null) {
                throw new BadRequestException("ظپط´ظ„ ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† طھظˆظƒظ† Google");
            }

            String sub = (String) body.get("sub");
            String email = (String) body.get("email");

            if (expectedSub != null && !expectedSub.equals(sub)) {
                log.warn("Google token sub mismatch: expected={}, got={}", expectedSub, sub);
                throw new BadRequestException("ظ…ط¹ط±ظپ ط§ظ„ظ…ط³طھط®ط¯ظ… ظپظٹ طھظˆظƒظ† Google ط؛ظٹط± ظ…طھط·ط§ط¨ظ‚");
            }

            if (expectedEmail != null && !expectedEmail.equals(email)) {
                log.warn("Google token email mismatch: expected={}, got={}", expectedEmail, email);
                throw new BadRequestException("ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ ظپظٹ طھظˆظƒظ† Google ط؛ظٹط± ظ…طھط·ط§ط¨ظ‚");
            }

            log.debug("Google token verified successfully for sub={}, email={}", sub, email);
            return body;
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Google token verification failed", e);
            throw new BadRequestException("ظپط´ظ„ ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† طھظˆظƒظ† GoogleطŒ ط§ظ„ط±ط¬ط§ط، ط§ظ„ظ…ط­ط§ظˆظ„ط© ظ…ط±ط© ط£ط®ط±ظ‰");
        }
    }
}
