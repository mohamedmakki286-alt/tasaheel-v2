package com.tasaheel.controller;

import com.tasaheel.dto.ApiResponse;
import com.tasaheel.dto.ServiceTypeDTO;
import com.tasaheel.dto.ServiceWorkshopDTO;
import com.tasaheel.entity.ServiceType;
import com.tasaheel.entity.WorkshopService;
import com.tasaheel.exception.ResourceNotFoundException;
import com.tasaheel.repository.MaintenanceRequestRepository;
import com.tasaheel.repository.QuoteRepository;
import com.tasaheel.repository.ServiceTypeRepository;
import com.tasaheel.repository.WorkshopServiceRepository;
import com.tasaheel.repository.ReviewRepository;
import jakarta.validation.Valid;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ServiceTypeController {

    private final ServiceTypeRepository serviceTypeRepository;
    private final WorkshopServiceRepository workshopServiceRepository;
    private final ReviewRepository reviewRepository;
    private final QuoteRepository quoteRepository;
    private final MaintenanceRequestRepository requestRepository;
    private final MessageSource msg;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ServiceTypeDTO>>> getAllServices() {
        List<ServiceTypeDTO> services = serviceTypeRepository.findByIsActiveTrue().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(services));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ServiceTypeDTO>> getServiceById(@PathVariable Long id) {
        ServiceType serviceType = serviceTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ServiceType", id));
        return ResponseEntity.ok(ApiResponse.success(toDTO(serviceType)));
    }

    @GetMapping("/{serviceId}/workshops")
    public ResponseEntity<ApiResponse<List<ServiceWorkshopDTO>>> getWorkshopsForService(
            @PathVariable Long serviceId,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng) {
        List<WorkshopService> links = workshopServiceRepository.findByServiceTypeId(serviceId);
        List<ServiceWorkshopDTO> result = links.stream().map(link -> {
            var w = link.getWorkshop();
            double dist = -1;
            if (lat != null && lng != null && w.getLatitude() != null && w.getLongitude() != null) {
                dist = haversine(lat, lng, w.getLatitude(), w.getLongitude());
            }
            long reviewCount = reviewRepository.countByWorkshopId(w.getId());
            long completedJobs = requestRepository.countByStatusAndWorkshopId("completed", w.getId());
            Long avgResponseTime = computeAvgResponseTime(w.getId());

            return ServiceWorkshopDTO.builder()
                    .workshopId(w.getId())
                    .workshopName(w.getName())
                    .workshopAddress(w.getAddress())
                    .workshopCity(w.getCity())
                    .workshopLat(w.getLatitude())
                    .workshopLng(w.getLongitude())
                    .workshopPhone(w.getPhone())
                    .workshopRating(w.getRating())
                    .reviewCount(reviewCount)
                    .workingHours(w.getWorkingHours())
                    .price(link.getPrice())
                    .distanceKm(dist >= 0 ? Math.round(dist * 10.0) / 10.0 : null)
                    .averageResponseTimeMinutes(avgResponseTime)
                    .completedJobs(completedJobs)
                    .build();
        }).sorted(Comparator.comparing(ServiceWorkshopDTO::getWorkshopRating).reversed()
                .thenComparing(Comparator.nullsLast(Comparator.comparingLong(ServiceWorkshopDTO::getAverageResponseTimeMinutes)))
                .thenComparing(Comparator.nullsLast(Comparator.comparingLong(ServiceWorkshopDTO::getCompletedJobs)).reversed()))
        .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ServiceTypeDTO>> createService(@Valid @RequestBody ServiceTypeDTO dto) {
        Locale locale = LocaleContextHolder.getLocale();
        ServiceType serviceType = ServiceType.builder()
                .name(dto.getName())
                .nameEn(dto.getNameEn())
                .icon(dto.getIcon())
                .description(dto.getDescription())
                .category(dto.getCategory())
                .isActive(true)
                .build();
        serviceType = serviceTypeRepository.save(serviceType);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(msg.getMessage("service.created", null, locale), toDTO(serviceType)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ServiceTypeDTO>> updateService(
            @PathVariable Long id,
            @Valid @RequestBody ServiceTypeDTO dto) {
        Locale locale = LocaleContextHolder.getLocale();
        ServiceType serviceType = serviceTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ServiceType", id));

        if (dto.getName() != null) serviceType.setName(dto.getName());
        if (dto.getNameEn() != null) serviceType.setNameEn(dto.getNameEn());
        if (dto.getIcon() != null) serviceType.setIcon(dto.getIcon());
        if (dto.getDescription() != null) serviceType.setDescription(dto.getDescription());
        if (dto.getIsActive() != null) serviceType.setIsActive(dto.getIsActive());
        if (dto.getCategory() != null) serviceType.setCategory(dto.getCategory());

        serviceType = serviceTypeRepository.save(serviceType);
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("service.updated", null, locale), toDTO(serviceType)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteService(@PathVariable Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        ServiceType serviceType = serviceTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ServiceType", id));
        serviceType.setIsActive(false);
        serviceTypeRepository.save(serviceType);
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("service.deactivated", null, locale), null));
    }

    private ServiceTypeDTO toDTO(ServiceType s) {
        return ServiceTypeDTO.builder()
                .id(s.getId())
                .name(s.getName())
                .nameEn(s.getNameEn())
                .icon(s.getIcon())
                .description(s.getDescription())
                .isActive(s.getIsActive())
                .category(s.getCategory())
                .estimatedDuration(s.getEstimatedDuration())
                .build();
    }

    private Long computeAvgResponseTime(Long workshopId) {
        List<Object[]> times = quoteRepository.findAcceptedQuoteTimesByWorkshopId(workshopId);
        if (times.isEmpty()) return null;
        double avg = times.stream()
                .mapToLong(t -> {
                    var quoteTime = (java.time.LocalDateTime) t[0];
                    var requestTime = (java.time.LocalDateTime) t[1];
                    return Duration.between(requestTime, quoteTime).toMinutes();
                })
                .average()
                .orElse(0);
        return Math.round(avg);
    }

    private static double haversine(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
