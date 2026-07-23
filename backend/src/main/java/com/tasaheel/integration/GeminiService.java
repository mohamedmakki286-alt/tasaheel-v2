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
        أنت مساعد سيارات متخصص ومفيد. اسمك "ساهل" (Sahel).
        تعمل لصالح منصة "صالح" لصيانة السيارات.

        قدراتك:
        - تقديم نصائح صيانة السيارات
        - تشخيص مشاكل السيارات بناءً على الأعراض
        - تقدير تكاليف الصيانة التقريبية
        - مشاركة معلومات الصيانة
        - اقتراح جدول الصيانة الدورية
        - الإجابة عن أسئلة متعلقة بالسيارات

        ملاحظات مهمة:
        - ردودك يجب أن تكون باللغة العربية الفصحى أو العامية المفهومة
        - كن ودوداً ومحترفاً في ردودك
        - إذا كان السؤال خارج مجال السيارات، أخبر المستخدم بلطف بأنك متخصص فقط في السيارات
        - لا تقدم نصائح طبية أو قانونية
        - للأسئلة المعقدة، انصح بزيارة ورشة متخصصة
        - استخدم الرموز التعبيرية المناسبة
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

        if (msg.contains("سلام") || msg.contains("مرحبا") || msg.contains("hi") || msg.contains("hello")) {
            return "وعليكم السلام! 😊 أنا ساهل، مساعد سيارات. كيف أقدر أساعدك اليوم؟";
        }
        if (msg.contains("زيت") || msg.contains("oil")) {
            return "تغيير الزيت مهم جداً لصحة المحرك! 🔧\n\n" +
                    "- يفضل تغيير الزيت كل 5000-10000 كم حسب نوع الزيت\n" +
                    "- أنواع الزيت: تركيبي (Synthetic) لكل 10000 كم، نصف تركيبي لكل 7500 كم، عادي لكل 5000 كم\n" +
                    "- تأكد من استخراج الزيت المستعمل لسيارتك\n" +
                    "- متوسط التكلفة: 150-300 ريال";
        }
        if (msg.contains("مكينة") || msg.contains("engine") || msg.contains("المحرك")) {
            return "مشاكل المكينة تتطلب تشخيص دقيق 🔍\n\n" +
                    "الأعراض الشائعة:\n" +
                    "• صوت طقطقة أو خشخشة - قد تكون مشكلة في البستم أو الصمامات\n" +
                    "• دخان أزرق - دليل على حرق زيت\n" +
                    "• دخان أبيض - قد يتسرّب مبرد\n" +
                    "• سخونة زائدة - مشكلة في التبريد\n\n" +
                    "أنصحك بزيارة ورشة متخصصة للفحص. التكلفة التقديرية: 500-5000 ريال حسب المشكلة.";
        }
        if (msg.contains("قير") || msg.contains("جير") || msg.contains("transmission") || msg.contains("gear")) {
            return "مشاكل القير (ناقل الحركة) تتطلب فحص دقيق 🛠️\n\n" +
                    "الأعراض:\n" +
                    "• تأخر في التعشيق - قد يكون زيت القير منتهي\n" +
                    "• رعشة عند التبديل - مشكلة في صمامات القير\n" +
                    "• صوت عالي - تأكد في التروس\n\n" +
                    "التكاليف التقديرية:\n" +
                    "• تغيير زيت القير: 200-500 ريال\n" +
                    "• صيانة قير: 2000-5000 ريال\n" +
                    "• تبديل قير كاملاً: 5000-15000 ريال";
        }
        if (msg.contains("كرهبة") || msg.contains("بطارية") || msg.contains("battery") || msg.contains("electrical")) {
            return "مشاكل الكهرباء في السيارة ⚡\n\n" +
                    "الأعراض الشائعة:\n" +
                    "• السيارة لا تبدأ (بدون صوت) - البطارية فارغة\n" +
                    "• إضاءة ضعيفة - الدينمو قد يكون عاطل\n" +
                    "• لمبة التحذير تشتغل - حسارات أو أسلاك\n\n" +
                    "التكاليف التقديرية:\n" +
                    "• بطارية جديدة: 200-600 ريال\n" +
                    "• دينمو جديد: 500-1500 ريال\n" +
                    "• سلف جديد: 300-800 ريال";
        }
        if (msg.contains("مكيف") || msg.contains("تكيف") || msg.contains("ac") || msg.contains("cooling")) {
            return "مشاكل المكيف ❄️\n\n" +
                    "الأعراض:\n" +
                    "• المكيف يطلع هواء حار - غاز المكيف خلص\n" +
                    "• صوت صفير - ضاغط المكيف\n" +
                    "• رائحة كريهة - الفلتر يحتاج تغيير\n\n" +
                    "التكاليف التقديرية:\n" +
                    "• تعبئة غاز: 150-300 ريال\n" +
                    "• صيانة ضاغط: 800-2000 ريال\n" +
                    "• تغيير فلتر المكيف: 50-150 ريال";
        }
        if (msg.contains("سمكرة") || msg.contains("دهان") || msg.contains("body") || msg.contains("paint")) {
            return "خدمات السمكرة والدهان 🎨\n\n" +
                    "• سمكرة بسيطة (صدمة صغيرة): 200-500 ريال\n" +
                    "• سمكرة متوسطة: 500-1500 ريال\n" +
                    "• دهان كامل للسيارة: 3000-8000 ريال\n" +
                    "• دهان ربع سيارة: 500-1500 ريال\n\n" +
                    "نصيحة: يفضل أخذ عينة لون قبل دهان السيارة للتطابق مع اللون الأصلي.";
        }
        if (msg.contains("ونش") || msg.contains("سحب") || msg.contains("tow")) {
            return "خدمة الونش وسحب السيارات 🚗\n\n" +
                    "متوفر في منصة صالح! 😊\n" +
                    "• سحب داخل المدينة: 100-300 ريال\n" +
                    "• سحب بين المدن: 3-5 ريال لكل كيلو\n" +
                    "• ونش للمنزل والعملاء متوفر\n\n" +
                    "تقدر طلب ونش مباشرة من التطبيق!";
        }
        if (msg.contains("سعر") || msg.contains("تكلفة") || msg.contains("كم") || msg.contains("price") || msg.contains("cost")) {
            return "التكاليف التقديرية للصيانة 💰\n\n" +
                    "• تغيير زيت: 150-300 ريال\n" +
                    "• تغيير بواب (شمعة احتراق): 100-400 ريال\n" +
                    "• تغيير فلاتر: 50-200 ريال\n" +
                    "• تغيير مساعدات: 800-2500 ريال\n" +
                    "• تغيير فرام: 300-800 ريال\n" +
                    "• تغيير إطارات (4): 1200-3000 ريال\n\n" +
                    "هذي أسعار تقريبية، تختلف حسب نوع السيارة والورشة.";
        }
        if (msg.contains("فرامل") || msg.contains("brake")) {
            return "مشاكل الفرامل 🚨\n\n" +
                    "الأعراض:\n" +
                    "• صوت صفير عند الفرملة - البانه خلصت\n" +
                    "• رعشة في المقود - الدسك (القرص) معوج\n" +
                    "• الفرامل ناعمة (تنزل للأسفل) - يحتاج زيت فرامل أو طرمبة\n\n" +
                    "التكاليف التقديرية:\n" +
                    "• تغيير بانه فرامل: 200-500 ريال\n" +
                    "• تغيير دسك وبانه: 500-1500 ريال\n" +
                    "• طرمبة فرامل: 300-1000 ريال";
        }
        if (msg.contains("دوري") || msg.contains("صيانة سيارة دورية") || msg.contains("maintenance") || msg.contains("schedule")) {
            return "جدول الصيانة الدورية 📋\n\n" +
                    "كل 5000-10000 كم:\n" +
                    "• تغيير زيت المحرك والفلتر\n" +
                    "• فحص ضغط الإطارات\n\n" +
                    "كل 20000-30000 كم:\n" +
                    "• تغيير فلتر الهواء\n" +
                    "• تغيير فلتر المكيف\n" +
                    "• تغيير البواب (شمعة الاحتراق)\n\n" +
                    "كل 40000-60000 كم:\n" +
                    "• تغيير زيت القير\n" +
                    "• تغيير زيت الفرامل\n" +
                    "• تغيير سير التايمن (إذا كان مرجوع)\n\n" +
                    "كل 80000-100000 كم:\n" +
                    "• تغيير المساعدات\n" +
                    "• تغيير طرمبة الماء\n" +
                    "• فحص شامل للسيارة";
        }
        if (msg.contains("شكر") || msg.contains("thanks") || msg.contains("thank")) {
            return "العفو! 😊 أنا موجود دايمًا لمساعدتك. إذا عندك سؤال ثاني، أنا هنا!";
        }
        if (msg.contains("وداع") || msg.contains("باي") || msg.contains("bye") || msg.contains("مع السلامة")) {
            return "مع السلامة! 👋 إلى اللقاء، كنت مساعدك. سلم لي على سيارتك! 😊";
        }

        String[] generalResponses = {
            "فهّمت سؤالك! 😊 في صلّحة، نقدر نساعدك في:\n" +
            "• طلب صيانة من ورشة معتمدة\n" +
            "• مقارنة عروض الأسعار\n" +
            "• تتبّع حالة الصيانة\n" +
            "• خدمة الونش والسحب\n\n" +
            "هل تقدر توضح أكثر عن مشكلتك عشان أقدر أساعدك؟",

            "شكراً لسؤالك! 👍\n" +
            "عشان أقدر أساعدك بشكل أفضل، هل تقدر:\n" +
            "• نوع السيارة (الموديل والسنة)\n" +
            "• وش الأعراض اللي تلاقيها\n" +
            "• من متى المشكلة",

            "مرحباً! 👋 أنا ساهل مساعد صلّحة.\n" +
            "ممكن أساعدك في:\n" +
            "• تشخيص مشاكل السيارات\n" +
            "• نصائح الصيانة\n" +
            "• معلومات عن التكاليف\n" +
            "• اقتراح ورش مناسبة\n\n" +
            "اكتب لي مشكلتك أو سؤالك 😊"
        };

        java.util.Random rand = new java.util.Random();
        return generalResponses[rand.nextInt(generalResponses.length)];
    }
}
