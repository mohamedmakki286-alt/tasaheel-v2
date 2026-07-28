package com.tasaheel.controller;

import com.tasaheel.integration.MediaStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/uploads")
@RequiredArgsConstructor
public class StoredMediaController {

    private final MediaStorageService storageService;

    @GetMapping("/{*objectKey}")
    public ResponseEntity<InputStreamResource> getObject(
            @PathVariable String objectKey,
            @RequestHeader(value = HttpHeaders.RANGE, required = false) String range) {
        MediaStorageService.StoredObject object = storageService.open(objectKey, range);
        if (object == null) return ResponseEntity.notFound().build();

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.ACCEPT_RANGES, "bytes");
        headers.setCacheControl(CacheControl.maxAge(1, TimeUnit.DAYS).cachePublic());
        if (object.contentType() != null && !object.contentType().isBlank()) {
            try {
                headers.setContentType(MediaType.parseMediaType(object.contentType()));
            } catch (Exception ignored) {
                headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            }
        }
        if (object.contentLength() != null) headers.setContentLength(object.contentLength());
        if (object.contentRange() != null && !object.contentRange().isBlank()) {
            headers.set(HttpHeaders.CONTENT_RANGE, object.contentRange());
        }
        if (object.eTag() != null && !object.eTag().isBlank()) {
            String eTag = object.eTag();
            if (!eTag.startsWith("\"") && !eTag.startsWith("W/\"")) eTag = "\"" + eTag + "\"";
            headers.setETag(eTag);
        }

        HttpStatus status = object.contentRange() == null ? HttpStatus.OK : HttpStatus.PARTIAL_CONTENT;
        return new ResponseEntity<>(new InputStreamResource(object.stream()), headers, status);
    }
}
