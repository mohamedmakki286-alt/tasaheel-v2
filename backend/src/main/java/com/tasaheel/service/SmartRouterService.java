package com.tasaheel.service;

import com.tasaheel.dto.SmartRouterRequest;
import com.tasaheel.dto.SmartRouterResponse;
import com.tasaheel.dto.SuggestedProviderDTO;
import com.tasaheel.entity.ServiceType;
import com.tasaheel.entity.Workshop;
import com.tasaheel.integration.GeminiService;
import com.tasaheel.repository.ServiceTypeRepository;
import com.tasaheel.repository.WorkshopRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SmartRouterService {

    private final GeminiService geminiService;
    private final ServiceTypeRepository serviceTypeRepository;
    private final WorkshopRepository workshopRepository;
    private final MessageSource msg;

    private static final Map<String, String> SERVICE_CATEGORY_MAP = new LinkedHashMap<>();

    static {
        SERVICE_CATEGORY_MAP.put("ط²ظٹطھ", "mobile_mechanic");
        SERVICE_CATEGORY_MAP.put("ط¨ط·ط§ط±ظٹط©", "mobile_mechanic");
        SERVICE_CATEGORY_MAP.put("ط¨و،†tery", "mobile_mechanic");
        SERVICE_CATEGORY_MAP.put("battery", "mobile_mechanic");
        SERVICE_CATEGORY_MAP.put("oil", "mobile_mechanic");
        SERVICE_CATEGORY_MAP.put("ظپط±ط§ظ…ظ„", "mobile_mechanic");
        SERVICE_CATEGORY_MAP.put("brake", "mobile_mechanic");
        SERVICE_CATEGORY_MAP.put("ط¥ط·ط§ط±", "mobile_mechanic");
        SERVICE_CATEGORY_MAP.put("tire", "mobile_mechanic");
        SERVICE_CATEGORY_MAP.put("tire", "mobile_mechanic");
        SERVICE_CATEGORY_MAP.put("ظ…ظƒظٹظپ", "mobile_mechanic");
        SERVICE_CATEGORY_MAP.put("ac", "mobile_mechanic");
        SERVICE_CATEGORY_MAP.put("ظپظ„طھط±", "mobile_mechanic");
        SERVICE_CATEGORY_MAP.put("filter", "mobile_mechanic");
        SERVICE_CATEGORY_MAP.put("ط¯ظˆط±ظٹ", "mobile_mechanic");
        SERVICE_CATEGORY_MAP.put("maintenance", "mobile_mechanic");
        SERVICE_CATEGORY_MAP.put("ظپط­طµ", "mobile_mechanic");
        SERVICE_CATEGORY_MAP.put("inspection", "mobile_mechanic");
        SERVICE_CATEGORY_MAP.put("ظ…ظˆظ„ظˆط¯", "mobile_mechanic");

        SERVICE_CATEGORY_MAP.put("ظ…ظƒظٹظ†ط©", "workshop");
        SERVICE_CATEGORY_MAP.put("engine", "workshop");
        SERVICE_CATEGORY_MAP.put("ظ‚ظٹط±", "workshop");
        SERVICE_CATEGORY_MAP.put("transmission", "workshop");
        SERVICE_CATEGORY_MAP.put("ط¬ظٹط±", "workshop");
        SERVICE_CATEGORY_MAP.put("ط³ظ…ظƒط±ط©", "workshop");
        SERVICE_CATEGORY_MAP.put("body", "workshop");
        SERVICE_CATEGORY_MAP.put("ط¯ظ‡ط§ظ†", "workshop");
        SERVICE_CATEGORY_MAP.put("paint", "workshop");
        SERVICE_CATEGORY_MAP.put("ط¯ظٹظ†ظ…ظˆ", "workshop");
        SERVICE_CATEGORY_MAP.put("alternator", "workshop");
        SERVICE_CATEGORY_MAP.put("ط³ظ„ظپ", "workshop");
        SERVICE_CATEGORY_MAP.put("starter", "workshop");
        SERVICE_CATEGORY_MAP.put("ظ…ط³ط§ط¹ط¯ط§طھ", "workshop");
        SERVICE_CATEGORY_MAP.put("suspension", "workshop");
        SERVICE_CATEGORY_MAP.put("ط´ط§طµظٹ", "workshop");
        SERVICE_CATEGORY_MAP.put("ط¹ط§ط¯ظ…", "workshop");
        SERVICE_CATEGORY_MAP.put("exhaust", "workshop");
        SERVICE_CATEGORY_MAP.put("طھط¨ط±ظٹط¯", "workshop");
        SERVICE_CATEGORY_MAP.put("cooling", "workshop");
        SERVICE_CATEGORY_MAP.put("ط±ط§ط¯ظٹطھط±", "workshop");
        SERVICE_CATEGORY_MAP.put("radiator", "workshop");

        SERVICE_CATEGORY_MAP.put("ظˆظ†ط´", "tow_truck");
        SERVICE_CATEGORY_MAP.put("ط³ط­ط¨", "tow_truck");
        SERVICE_CATEGORY_MAP.put("tow", "tow_truck");
        SERVICE_CATEGORY_MAP.put("ط³ط­ط§ط¨", "tow_truck");
        SERVICE_CATEGORY_MAP.put("طھط¹ط·ظ„", "tow_truck");
        SERVICE_CATEGORY_MAP.put("ط¹ط·ظ„", "tow_truck");
        SERVICE_CATEGORY_MAP.put("breakdown", "tow_truck");
        SERVICE_CATEGORY_MAP.put("ط­ط§ط¯ط«", "tow_truck");
        SERVICE_CATEGORY_MAP.put("accident", "tow_truck");
        SERVICE_CATEGORY_MAP.put("طھطµظ„ظٹط­", "tow_truck");
        SERVICE_CATEGORY_MAP.put("ظ…ط´ظˆط§ط±", "tow_truck");
    }

    private static final Map<String, String> MODE_ICONS = Map.of(
            "mobile_mechanic", "account-wrench",
            "workshop", "car-wrench",
            "tow_truck", "truck"
    );

    public SmartRouterResponse route(SmartRouterRequest request) {
        String description = request.getDescription() != null ? request.getDescription().toLowerCase() : "";
        String serviceName = request.getServiceTypeName() != null ? request.getServiceTypeName() : "";

        String category = determineCategory(description, serviceName);

        var locale = LocaleContextHolder.getLocale();
        String modeLabel = msg.getMessage("smartrouter.mode." + category, null, locale);
        String modeIcon = MODE_ICONS.getOrDefault(category, "car-wrench");
        String reasoning = generateReasoning(category, locale);

        List<String> availableOptions = getAvailableOptions(category, locale);

        List<SuggestedProviderDTO> providers = findProviders(category, request.getCity());

        return SmartRouterResponse.builder()
                .suggestedMode(category)
                .modeLabel(modeLabel)
                .modeIcon(modeIcon)
                .reasoning(reasoning)
                .availableOptions(availableOptions)
                .suggestedProviders(providers)
                .build();
    }

    public String determineCategory(String description, String serviceName) {
        String combined = description + " " + serviceName;

        for (Map.Entry<String, String> entry : SERVICE_CATEGORY_MAP.entrySet()) {
            if (combined.contains(entry.getKey())) {
                return entry.getValue();
            }
        }

        Optional<ServiceType> serviceTypeOpt = serviceTypeRepository.findByName(serviceName);
        if (serviceTypeOpt.isPresent() && serviceTypeOpt.get().getCategory() != null) {
            return serviceTypeOpt.get().getCategory();
        }

        return "workshop";
    }

    private String generateReasoning(String category, Locale locale) {
        return msg.getMessage("smartrouter.reasoning." + category, null, locale);
    }

    private List<String> getAvailableOptions(String category, Locale locale) {
        String workshop = msg.getMessage("smartrouter.mode.workshop", null, locale);
        String mobile = msg.getMessage("smartrouter.mode.mobile_mechanic", null, locale);
        String tow = msg.getMessage("smartrouter.mode.tow_truck", null, locale);
        return switch (category) {
            case "mobile_mechanic" -> List.of(mobile, workshop);
            case "tow_truck" -> List.of(tow, workshop);
            default -> List.of(workshop, mobile);
        };
    }

    private List<SuggestedProviderDTO> findProviders(String category, String city) {
        List<Workshop> workshops;

        if ("mobile_mechanic".equals(category)) {
            workshops = workshopRepository.findByCityAndIsApprovedAndIsActive(city, true, true).stream()
                    .filter(w -> "mobile".equals(w.getWorkshopType()) || "both".equals(w.getWorkshopType()))
                    .collect(Collectors.toList());
            if (workshops.isEmpty()) {
                workshops = workshopRepository.findByIsApprovedAndIsActive(true, true).stream()
                        .filter(w -> "mobile".equals(w.getWorkshopType()) || "both".equals(w.getWorkshopType()))
                        .collect(Collectors.toList());
            }
        } else {
            workshops = workshopRepository.findByCityAndIsApprovedAndIsActive(city, true, true);
            if (workshops.isEmpty()) {
                workshops = workshopRepository.findByIsApprovedAndIsActive(true, true);
            }
        }

        return workshops.stream()
                .limit(5)
                .map(w -> SuggestedProviderDTO.builder()
                        .id(w.getId())
                        .name(w.getName())
                        .type("workshop")
                        .city(w.getCity())
                        .rating(w.getRating())
                        .workshopType(w.getWorkshopType())
                        .build())
                .collect(Collectors.toList());
    }
}
