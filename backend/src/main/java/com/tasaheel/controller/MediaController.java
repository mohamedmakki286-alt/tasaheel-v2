package com.tasaheel.controller;

import com.tasaheel.dto.ApiResponse;
import com.tasaheel.dto.MediaDTO;
import com.tasaheel.entity.Media;
import com.tasaheel.entity.MaintenanceRequest;
import com.tasaheel.integration.MediaService;
import com.tasaheel.repository.MaintenanceRequestRepository;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MediaController {

    private final MediaService mediaService;
    private final MaintenanceRequestRepository requestRepository;
    private final MessageSource msg;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<MediaDTO>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("requestId") Long requestId) {
        Locale locale = LocaleContextHolder.getLocale();
        MaintenanceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        Media media = mediaService.uploadFile(file, requestId, request);
        MediaDTO dto = toMediaDTO(media);
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("media.uploaded", null, locale), dto));
    }

    @PostMapping("/upload-image")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "prefix", defaultValue = "img") String prefix) {
        String url = mediaService.storeFile(file, prefix);
        return ResponseEntity.ok(ApiResponse.success("Uploaded", Map.of("url", url)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFile(@PathVariable Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        mediaService.deleteFile(id);
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("media.deleted", null, locale), null));
    }

    @GetMapping("/request/{requestId}")
    public ResponseEntity<ApiResponse<List<MediaDTO>>> getRequestFiles(@PathVariable Long requestId) {
        List<Media> mediaList = mediaService.getFilesByRequest(requestId);
        List<MediaDTO> dtos = mediaList.stream().map(this::toMediaDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    private MediaDTO toMediaDTO(Media media) {
        return MediaDTO.builder()
                .id(media.getId())
                .requestId(media.getRequest().getId())
                .type(media.getType())
                .url(media.getUrl())
                .thumbnailUrl(media.getThumbnailUrl())
                .createdAt(media.getCreatedAt())
                .build();
    }
}
