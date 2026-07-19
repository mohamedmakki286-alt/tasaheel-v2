package com.tasaheel.service;

import com.tasaheel.dto.PlatformSettingDTO;
import com.tasaheel.entity.PlatformSetting;
import com.tasaheel.exception.ResourceNotFoundException;
import com.tasaheel.repository.PlatformSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlatformSettingService {

    private final PlatformSettingRepository repository;

    public List<PlatformSettingDTO> getAllSettings() {
        return repository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public String getSetting(String key, String defaultValue) {
        return repository.findBySettingKey(key)
                .map(PlatformSetting::getSettingValue)
                .orElse(defaultValue);
    }

    public Double getDoubleSetting(String key, Double defaultValue) {
        String val = getSetting(key, null);
        if (val == null) return defaultValue;
        try {
            return Double.parseDouble(val);
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    @Transactional
    public PlatformSettingDTO setSetting(String key, String value, String description) {
        PlatformSetting setting = repository.findBySettingKey(key)
                .orElse(PlatformSetting.builder()
                        .settingKey(key)
                        .build());
        setting.setSettingValue(value);
        if (description != null) setting.setDescription(description);
        setting = repository.save(setting);
        return toDTO(setting);
    }

    public Double getDefaultCommissionRate() {
        return getDoubleSetting("default_commission_percentage", 10.0);
    }

    private PlatformSettingDTO toDTO(PlatformSetting s) {
        return PlatformSettingDTO.builder()
                .id(s.getId())
                .settingKey(s.getSettingKey())
                .settingValue(s.getSettingValue())
                .description(s.getDescription())
                .build();
    }
}
