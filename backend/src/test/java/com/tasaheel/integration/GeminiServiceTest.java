package com.tasaheel.integration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class GeminiServiceTest {
    private GeminiService service;

    @BeforeEach
    void setUp() {
        service = new GeminiService();
        ReflectionTestUtils.setField(service, "apiKey", "");
    }

    @Test
    void redOilWarningMustStopEngineBeforeAnyMaintenanceAdvice() {
        String reply = service.chat(
                "عندي لمبة زيت حمراء والمكينة صوتها عالي ماذا أفعل؟",
                List.of(),
                "المستخدم زائر");

        assertThat(reply).startsWith("أوقف المحرك فوراً");
        assertThat(reply).contains("لا تواصل القيادة", "اطلب سحب السيارة");
        assertThat(reply).doesNotContain("كل 5000");
    }

    @Test
    void personalQuestionUsesTrustedPlatformContextWhenModelUnavailable() {
        String context = "بيانات مؤكدة من تساهيل: آخر طلب رقم 42، الحالة قيد التنفيذ.";
        String reply = service.chat("ما حالة آخر طلب لي؟", List.of(), context);

        assertThat(reply).contains("رقم 42", "قيد التنفيذ");
    }

    @Test
    void genericPriceQuestionDoesNotInventFixedPrice() {
        String reply = service.chat("كم سعر إصلاح سيارتي؟", List.of(), "المستخدم زائر");

        assertThat(reply).contains("السعر الملزم يظهر في عرض الورشة");
        assertThat(reply).doesNotContain("150-300");
    }

    @Test
    void fallbackAnswersDifferentIntentsInsteadOfRepeatingGenericPrompt() {
        String battery = service.chat("السيارة ما تدق سلف والأنوار ضعيفة", List.of(), "المستخدم زائر");
        String ac = service.chat("المكيف ما يبرد أثناء الوقوف", List.of(), "المستخدم زائر");
        String booking = service.chat("كيف أطلب خدمة صيانة؟", List.of(), "المستخدم زائر");

        assertThat(battery).contains("البطارية");
        assertThat(ac).contains("المكيف", "الفريون");
        assertThat(booking).contains("من الرئيسية اختر الخدمة");
        assertThat(battery).isNotEqualTo(ac).isNotEqualTo(booking);
    }

    @Test
    void unknownFallbackExplainsTemporaryAiUnavailabilityWithoutRepeatingVehicleChecklist() {
        String reply = service.chat("هل يمكن أن تشرح لي هذا بطريقة أخرى؟", List.of(), "المستخدم زائر");

        assertThat(reply).contains("غير متاحة مؤقتاً");
        assertThat(reply).doesNotContain("سنة الصنع، العداد، الأعراض");
    }
}
