package com.tasaheel.integration;

import com.tasaheel.entity.Media;
import com.tasaheel.entity.MaintenanceRequest;
import com.tasaheel.exception.BadRequestException;
import com.tasaheel.repository.MediaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class MediaService {

    private final MediaRepository mediaRepository;
    private final MediaStorageService storageService;

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );
    private static final Set<String> ALLOWED_AUDIO_TYPES = Set.of(
            "audio/webm", "audio/ogg", "audio/mp4", "audio/m4a",
            "audio/aac", "audio/mpeg", "audio/wav"
    );
    private static final Set<String> ALLOWED_VIDEO_TYPES = Set.of(
            "video/mp4", "video/webm", "video/quicktime", "video/x-matroska"
    );
    private static final Set<String> ALLOWED_FILE_TYPES = new HashSet<>();
    private static final long MAX_FILE_SIZE = 30L * 1024 * 1024;

    static {
        ALLOWED_FILE_TYPES.addAll(ALLOWED_IMAGE_TYPES);
        ALLOWED_FILE_TYPES.addAll(ALLOWED_AUDIO_TYPES);
        ALLOWED_FILE_TYPES.addAll(ALLOWED_VIDEO_TYPES);
        ALLOWED_FILE_TYPES.addAll(Set.of(
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ));
    }

    public void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("الملف مطلوب");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("حجم الملف يتجاوز الحد الأقصى (30 ميجابايت)");
        }
        String contentType = normalizeContentType(file.getContentType());
        if (!ALLOWED_FILE_TYPES.contains(contentType)) {
            throw new BadRequestException("نوع الملف غير مدعوم: " + file.getContentType());
        }
    }

    public String storeFile(MultipartFile file, String prefix) {
        validateFile(file);
        return storageService.store(file, prefix).fileUrl();
    }

    public Map<String, Object> storeFileWithMetadata(MultipartFile file, String prefix) {
        validateFile(file);
        MediaStorageService.StoredFile stored = storageService.store(file, prefix);
        Map<String, Object> result = new HashMap<>();
        result.put("storageKey", stored.storageKey());
        result.put("fileUrl", stored.fileUrl());
        result.put("mimeType", stored.mimeType());
        result.put("fileSize", stored.fileSize());
        result.put("originalFileName", stored.originalFileName());
        return result;
    }

    public Media uploadFile(MultipartFile file, Long requestId, MaintenanceRequest request) {
        validateFile(file);
        MediaStorageService.StoredFile stored = storageService.store(file, "requests/" + requestId);
        String mediaType = stored.mimeType().startsWith("video/") ? "video"
                : stored.mimeType().startsWith("audio/") ? "audio" : "image";

        Media media = Media.builder()
                .request(request)
                .type(mediaType)
                .url(stored.fileUrl())
                .thumbnailUrl(null)
                .originalFileName(stored.originalFileName())
                .mimeType(stored.mimeType())
                .fileSize(stored.fileSize())
                .build();
        return mediaRepository.save(media);
    }

    public List<Media> getFilesByRequest(Long requestId) {
        return mediaRepository.findByRequestIdOrderByCreatedAtAsc(requestId);
    }

    public void deleteFile(Long mediaId) {
        Media media = mediaRepository.findById(mediaId)
                .orElseThrow(() -> new BadRequestException("الملف غير موجود"));
        storageService.deleteByUrl(media.getUrl());
        storageService.deleteByUrl(media.getThumbnailUrl());
        mediaRepository.delete(media);
    }

    private String normalizeContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) return "";
        return contentType.toLowerCase(Locale.ROOT).split(";", 2)[0].trim();
    }
}
