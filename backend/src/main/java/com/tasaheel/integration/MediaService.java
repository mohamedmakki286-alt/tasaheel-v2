package com.tasaheel.integration;

import com.tasaheel.entity.Media;
import com.tasaheel.exception.BadRequestException;
import com.tasaheel.repository.MediaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class MediaService {

    private final MediaRepository mediaRepository;

    @Value("${application.upload.dir}")
    private String uploadDir;

    @Value("${application.public-url:}")
    private String publicUrl;

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
        "image/jpeg", "image/png", "image/webp", "image/gif"
    );

    private static final Set<String> ALLOWED_AUDIO_TYPES = Set.of(
        "audio/webm", "audio/ogg", "audio/mp4", "audio/m4a",
        "audio/aac", "audio/mpeg", "audio/wav"
    );

    private static final Set<String> ALLOWED_FILE_TYPES = new HashSet<>();
    static {
        ALLOWED_FILE_TYPES.addAll(ALLOWED_IMAGE_TYPES);
        ALLOWED_FILE_TYPES.addAll(ALLOWED_AUDIO_TYPES);
        ALLOWED_FILE_TYPES.addAll(Set.of(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ));
    }

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    public void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("الملف مطلوب");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("حجم الملف يتجاوز الحد الأقصى (10 ميجا)");
        }
        String contentType = file.getContentType();
        String normalizedContentType = contentType == null
                ? null
                : contentType.toLowerCase(Locale.ROOT).split(";", 2)[0].trim();
        if (normalizedContentType == null || !ALLOWED_FILE_TYPES.contains(normalizedContentType)) {
            throw new BadRequestException("نوع الملف غير مدعوم: " + contentType);
        }
    }

    public String getPublicBaseUrl() {
        if (publicUrl != null && !publicUrl.isBlank()) {
            return publicUrl.replaceAll("/$", "");
        }
        return "https://api.salabaa.com";
    }

    public String storeFile(MultipartFile file, String prefix) {
        validateFile(file);
        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            String originalFileName = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }
            String fileName = prefix + "_" + UUID.randomUUID() + fileExtension;

            Path targetLocation = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return getPublicBaseUrl() + "/uploads/" + fileName;
        } catch (IOException e) {
            log.error("Failed to store file: {}", e.getMessage());
            throw new BadRequestException("فشل حفظ الملف");
        }
    }

    public Map<String, Object> storeFileWithMetadata(MultipartFile file, String prefix) {
        validateFile(file);
        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            String originalFileName = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }
            String fileName = prefix + "_" + UUID.randomUUID() + fileExtension;
            String storageKey = prefix + "/" + fileName;

            Path targetLocation = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = getPublicBaseUrl() + "/uploads/" + fileName;
            String mimeType = file.getContentType() != null ? file.getContentType().toLowerCase() : "application/octet-stream";

            Map<String, Object> result = new HashMap<>();
            result.put("storageKey", storageKey);
            result.put("fileUrl", fileUrl);
            result.put("mimeType", mimeType);
            result.put("fileSize", file.getSize());
            result.put("originalFileName", originalFileName != null ? originalFileName : fileName);
            return result;
        } catch (IOException e) {
            log.error("Failed to store file: {}", e.getMessage());
            throw new BadRequestException("فشل حفظ الملف");
        }
    }

    public Media uploadFile(MultipartFile file, Long requestId, com.tasaheel.entity.MaintenanceRequest request) {
        validateFile(file);
        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            String originalFileName = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }
            String fileName = UUID.randomUUID() + fileExtension;

            Path targetLocation = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            String contentType = file.getContentType();
            String mediaType = "image";
            if (contentType != null && contentType.startsWith("video")) {
                mediaType = "video";
            }

            Media media = Media.builder()
                    .request(request)
                    .type(mediaType)
                    .url(getPublicBaseUrl() + "/uploads/" + fileName)
                    .thumbnailUrl(getPublicBaseUrl() + "/uploads/thumb_" + fileName)
                    .build();

            return mediaRepository.save(media);
        } catch (IOException e) {
            log.error("Failed to upload file: {}", e.getMessage());
            throw new BadRequestException("فشل رفع الملف");
        }
    }

    public List<Media> getFilesByRequest(Long requestId) {
        return mediaRepository.findByRequestIdOrderByCreatedAtAsc(requestId);
    }

    public void deleteFile(Long mediaId) {
        Media media = mediaRepository.findById(mediaId)
                .orElseThrow(() -> new BadRequestException("الملف غير موجود"));

        try {
            Path filePath = Paths.get(uploadDir).resolve(media.getUrl().replace("/uploads/", "")).normalize();
            Files.deleteIfExists(filePath);
            if (media.getThumbnailUrl() != null) {
                Path thumbPath = Paths.get(uploadDir).resolve(media.getThumbnailUrl().replace("/uploads/", "")).normalize();
                Files.deleteIfExists(thumbPath);
            }
        } catch (IOException e) {
            log.warn("Failed to delete file: {}", e.getMessage());
        }

        mediaRepository.delete(media);
    }
}
