package com.tasaheel.integration;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import com.tasaheel.exception.BadRequestException;

import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class MediaStorageServiceTest {

    @TempDir
    Path tempDir;

    @Test
    void storesReadsAndDeletesUsingCompatibleUploadUrl() throws Exception {
        MediaStorageService service = localService();
        MockMultipartFile file = new MockMultipartFile(
                "file", "voice.webm", "audio/webm", "voice-data".getBytes());

        MediaStorageService.StoredFile stored = service.store(file, "chat/42");

        assertThat(stored.storageKey()).startsWith("chat/42/");
        assertThat(stored.fileUrl()).startsWith("http://localhost:8080/uploads/chat/42/");
        assertThat(service.keyFromUrl(stored.fileUrl())).isEqualTo(stored.storageKey());

        MediaStorageService.StoredObject loaded = service.open(stored.storageKey(), null);
        assertThat(loaded).isNotNull();
        assertThat(loaded.stream().readAllBytes()).isEqualTo("voice-data".getBytes());

        service.delete(stored.storageKey());
        assertThat(service.open(stored.storageKey(), null)).isNull();
    }

    @Test
    void rejectsTraversalInClientSuppliedPrefix() {
        MediaStorageService service = localService();
        MockMultipartFile file = new MockMultipartFile(
                "file", "photo.jpg", "image/jpeg", new byte[]{1, 2, 3});

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.store(file, "../../chat unsafe"))
                .isInstanceOf(BadRequestException.class);
    }

    private MediaStorageService localService() {
        MediaStorageService service = new MediaStorageService();
        ReflectionTestUtils.setField(service, "provider", "local");
        ReflectionTestUtils.setField(service, "uploadDir", tempDir.toString());
        ReflectionTestUtils.setField(service, "publicUrl", "http://localhost:8080");
        return service;
    }
}
