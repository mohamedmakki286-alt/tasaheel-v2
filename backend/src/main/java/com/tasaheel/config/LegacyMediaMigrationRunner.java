package com.tasaheel.config;

import com.tasaheel.integration.MediaStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "application.storage.migrate-local-on-startup", havingValue = "true")
public class LegacyMediaMigrationRunner implements ApplicationRunner {

    private final MediaStorageService storageService;

    @Override
    public void run(ApplicationArguments args) {
        storageService.migrateLegacyLocalFiles();
    }
}
