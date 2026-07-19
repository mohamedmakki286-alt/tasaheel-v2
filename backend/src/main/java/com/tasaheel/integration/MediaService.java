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
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MediaService {

    private final MediaRepository mediaRepository;

    @Value("${application.upload.dir}")
    private String uploadDir;

    public String storeFile(MultipartFile file, String prefix) {
        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            String originalFileName = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }
            String fileName = prefix + "_" + UUID.randomUUID().toString() + fileExtension;

            Path targetLocation = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return "/uploads/" + fileName;
        } catch (IOException e) {
            log.error("Failed to store file: {}", e.getMessage());
            throw new BadRequestException("Failed to store file: " + e.getMessage());
        }
    }

    public Media uploadFile(MultipartFile file, Long requestId, com.tasaheel.entity.MaintenanceRequest request) {
        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            String originalFileName = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }
            String fileName = UUID.randomUUID().toString() + fileExtension;

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
                    .url("/uploads/" + fileName)
                    .thumbnailUrl("/uploads/thumb_" + fileName)
                    .build();

            return mediaRepository.save(media);
        } catch (IOException e) {
            log.error("Failed to upload file: {}", e.getMessage());
            throw new BadRequestException("Failed to upload file: " + e.getMessage());
        }
    }

    public List<Media> getFilesByRequest(Long requestId) {
        return mediaRepository.findByRequestIdOrderByCreatedAtAsc(requestId);
    }

    public void deleteFile(Long mediaId) {
        Media media = mediaRepository.findById(mediaId)
                .orElseThrow(() -> new BadRequestException("Media not found"));

        try {
            Path filePath = Paths.get(uploadDir).resolve(media.getUrl().replace("/uploads/", "")).normalize();
            Files.deleteIfExists(filePath);

            Path thumbPath = Paths.get(uploadDir).resolve(media.getThumbnailUrl().replace("/uploads/", "")).normalize();
            Files.deleteIfExists(thumbPath);
        } catch (IOException e) {
            log.warn("Failed to delete file: {}", e.getMessage());
        }

        mediaRepository.delete(media);
    }
}
