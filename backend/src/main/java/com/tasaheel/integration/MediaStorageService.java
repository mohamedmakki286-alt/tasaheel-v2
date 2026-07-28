package com.tasaheel.integration;

import com.oracle.bmc.Region;
import com.oracle.bmc.auth.InstancePrincipalsAuthenticationDetailsProvider;
import com.oracle.bmc.model.Range;
import com.oracle.bmc.objectstorage.ObjectStorage;
import com.oracle.bmc.objectstorage.ObjectStorageClient;
import com.oracle.bmc.objectstorage.requests.DeleteObjectRequest;
import com.oracle.bmc.objectstorage.requests.GetObjectRequest;
import com.oracle.bmc.objectstorage.requests.PutObjectRequest;
import com.oracle.bmc.objectstorage.responses.GetObjectResponse;
import com.tasaheel.exception.BadRequestException;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Stream;
import java.util.Locale;
import java.util.UUID;

@Service
@Slf4j
public class MediaStorageService {

    @Value("${application.storage.provider:local}")
    private String provider;

    @Value("${application.upload.dir}")
    private String uploadDir;

    @Value("${application.public-url:}")
    private String publicUrl;

    @Value("${application.storage.oci.region:me-riyadh-1}")
    private String region;

    @Value("${application.storage.oci.namespace:}")
    private String namespace;

    @Value("${application.storage.oci.bucket:}")
    private String bucket;

    private volatile ObjectStorage objectStorage;

    public StoredFile store(MultipartFile file, String requestedPrefix) {
        String prefix = sanitizePrefix(requestedPrefix);
        String extension = safeExtension(file.getOriginalFilename());
        String key = prefix + "/" + UUID.randomUUID() + extension;
        String contentType = normalizeContentType(file.getContentType());

        try {
            if (isOci()) {
                ObjectStorage client = ociClient();
                try (InputStream input = file.getInputStream()) {
                    client.putObject(PutObjectRequest.builder()
                            .namespaceName(required(namespace, "OCI namespace"))
                            .bucketName(required(bucket, "OCI bucket"))
                            .objectName(key)
                            .contentLength(file.getSize())
                            .contentType(contentType)
                            .putObjectBody(input)
                            .build());
                }
            } else {
                Path root = localRoot();
                Path target = root.resolve(key).normalize();
                requireWithinRoot(root, target);
                Files.createDirectories(target.getParent());
                Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            }
            return new StoredFile(key, publicUrl(key), contentType, file.getSize(),
                    file.getOriginalFilename() == null ? key.substring(key.lastIndexOf('/') + 1) : file.getOriginalFilename());
        } catch (Exception error) {
            log.error("Failed to store media object {} using {}: {}", key, provider, error.getMessage());
            throw new BadRequestException("فشل حفظ الملف");
        }
    }

    public StoredObject open(String rawKey, String rangeHeader) {
        String key = normalizeKey(rawKey);
        try {
            if (isOci()) {
                GetObjectRequest.Builder request = GetObjectRequest.builder()
                        .namespaceName(required(namespace, "OCI namespace"))
                        .bucketName(required(bucket, "OCI bucket"))
                        .objectName(key);
                if (rangeHeader != null && !rangeHeader.isBlank()) request.range(parseRange(rangeHeader));
                GetObjectResponse response = ociClient().getObject(request.build());
                return new StoredObject(response.getInputStream(), response.getContentType(),
                        response.getContentLength(), formatContentRange(response.getContentRange()), response.getETag());
            }

            return openLocal(key);
        } catch (com.oracle.bmc.model.BmcException error) {
            if (error.getStatusCode() == 404) return openLocal(key);
            throw error;
        }
    }

    public void delete(String rawKey) {
        String key = normalizeKey(rawKey);
        if (key.isBlank()) return;
        try {
            if (isOci()) {
                try {
                    ociClient().deleteObject(DeleteObjectRequest.builder()
                            .namespaceName(required(namespace, "OCI namespace"))
                            .bucketName(required(bucket, "OCI bucket"))
                            .objectName(key)
                            .build());
                } finally {
                    deleteLocal(key);
                }
            } else {
                deleteLocal(key);
            }
        } catch (com.oracle.bmc.model.BmcException error) {
            if (error.getStatusCode() != 404) throw error;
        } catch (IOException error) {
            log.warn("Failed to delete media object {}: {}", key, error.getMessage());
        }
    }

    public void deleteByUrl(String url) {
        String key = keyFromUrl(url);
        if (!key.isBlank()) delete(key);
    }

    public String keyFromUrl(String url) {
        if (url == null || url.isBlank()) return "";
        int marker = url.indexOf("/uploads/");
        if (marker < 0) return "";
        return normalizeKey(url.substring(marker + "/uploads/".length()));
    }

    public String publicUrl(String key) {
        String base = (publicUrl == null || publicUrl.isBlank()) ? "https://api.salabaa.com" : publicUrl;
        return base.replaceAll("/$", "") + "/uploads/" + normalizeKey(key);
    }

    public boolean isOci() {
        return "oci".equalsIgnoreCase(provider);
    }

    public int migrateLegacyLocalFiles() {
        if (!isOci()) return 0;
        AtomicInteger migrated = new AtomicInteger();
        try {
            Path root = localRoot();
            try (Stream<Path> files = Files.walk(root)) {
                files.filter(Files::isRegularFile).forEach(file -> {
                    String key = root.relativize(file).toString().replace('\\', '/');
                    try (InputStream input = Files.newInputStream(file)) {
                        String contentType = Files.probeContentType(file);
                        ociClient().putObject(PutObjectRequest.builder()
                                .namespaceName(required(namespace, "OCI namespace"))
                                .bucketName(required(bucket, "OCI bucket"))
                                .objectName(key)
                                .contentLength(Files.size(file))
                                .contentType(contentType == null ? "application/octet-stream" : contentType)
                                .putObjectBody(input)
                                .build());
                        migrated.incrementAndGet();
                    } catch (Exception error) {
                        log.error("Failed to migrate legacy media object {}: {}", key, error.getMessage());
                    }
                });
            }
        } catch (IOException error) {
            log.error("Failed to scan legacy media directory: {}", error.getMessage());
        }
        log.info("Legacy media migration completed: {} objects copied to Oracle Object Storage", migrated.get());
        return migrated.get();
    }

    private ObjectStorage ociClient() {
        ObjectStorage existing = objectStorage;
        if (existing != null) return existing;
        synchronized (this) {
            if (objectStorage == null) {
                InstancePrincipalsAuthenticationDetailsProvider auth =
                        InstancePrincipalsAuthenticationDetailsProvider.builder().build();
                ObjectStorageClient client = ObjectStorageClient.builder().build(auth);
                client.setRegion(Region.fromRegionId(required(region, "OCI region")));
                objectStorage = client;
                log.info("Oracle Object Storage initialized: region={}, namespace={}, bucket={}", region, namespace, bucket);
            }
            return objectStorage;
        }
    }

    private Path localRoot() throws IOException {
        Path root = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(root);
        return root;
    }

    private StoredObject openLocal(String key) {
        try {
            Path root = localRoot();
            Path target = root.resolve(key).normalize();
            requireWithinRoot(root, target);
            if (!Files.exists(target) || !Files.isRegularFile(target)) return null;
            String contentType = Files.probeContentType(target);
            return new StoredObject(Files.newInputStream(target),
                    contentType == null ? "application/octet-stream" : contentType,
                    Files.size(target), null, null);
        } catch (IOException error) {
            log.warn("Failed to open legacy local media object {}: {}", key, error.getMessage());
            return null;
        }
    }

    private void deleteLocal(String key) throws IOException {
        Path root = localRoot();
        Path target = root.resolve(key).normalize();
        requireWithinRoot(root, target);
        Files.deleteIfExists(target);
    }

    private void requireWithinRoot(Path root, Path target) {
        if (!target.startsWith(root)) throw new BadRequestException("مسار الملف غير صالح");
    }

    private String normalizeKey(String value) {
        String key = value == null ? "" : value.replace('\\', '/');
        while (key.startsWith("/")) key = key.substring(1);
        if (key.contains("..")) throw new BadRequestException("مسار الملف غير صالح");
        return key;
    }

    private String sanitizePrefix(String value) {
        String prefix = normalizeKey(value == null || value.isBlank() ? "media" : value);
        prefix = prefix.replaceAll("[^a-zA-Z0-9/_-]", "-").replaceAll("/+", "/");
        return prefix.isBlank() ? "media" : prefix;
    }

    private String safeExtension(String originalName) {
        if (originalName == null) return "";
        int dot = originalName.lastIndexOf('.');
        if (dot < 0 || dot == originalName.length() - 1) return "";
        String extension = originalName.substring(dot).toLowerCase(Locale.ROOT);
        return extension.matches("\\.[a-z0-9]{1,10}") ? extension : "";
    }

    private String normalizeContentType(String value) {
        if (value == null || value.isBlank()) return "application/octet-stream";
        return value.toLowerCase(Locale.ROOT).split(";", 2)[0].trim();
    }

    private Range parseRange(String value) {
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        if (!normalized.startsWith("bytes=")) throw new BadRequestException("نطاق الملف غير صالح");
        String[] parts = normalized.substring(6).split("-", -1);
        if (parts.length != 2) throw new BadRequestException("نطاق الملف غير صالح");
        Long start = parts[0].isBlank() ? null : Long.parseLong(parts[0]);
        Long end = parts[1].isBlank() ? null : Long.parseLong(parts[1]);
        if (start == null && end == null) throw new BadRequestException("نطاق الملف غير صالح");
        return new Range(start, end);
    }

    private String formatContentRange(Range range) {
        if (range == null) return null;
        String total = range.getContentLength() == null ? "*" : String.valueOf(range.getContentLength());
        return "bytes " + range.getStartByte() + "-" + range.getEndByte() + "/" + total;
    }

    private String required(String value, String label) {
        if (value == null || value.isBlank()) throw new IllegalStateException(label + " is not configured");
        return value.trim();
    }

    @PreDestroy
    public void close() {
        if (objectStorage != null) {
            try {
                objectStorage.close();
            } catch (Exception error) {
                log.debug("Failed to close Oracle Object Storage client cleanly: {}", error.getMessage());
            }
        }
    }

    public record StoredFile(String storageKey, String fileUrl, String mimeType, long fileSize,
                             String originalFileName) {}

    public record StoredObject(InputStream stream, String contentType, Long contentLength,
                               String contentRange, String eTag) {}
}
