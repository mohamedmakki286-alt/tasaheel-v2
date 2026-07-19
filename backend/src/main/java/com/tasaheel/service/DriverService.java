package com.tasaheel.service;

import com.tasaheel.dto.DriverDTO;
import com.tasaheel.dto.TransportRequestDTO;
import com.tasaheel.entity.Driver;
import com.tasaheel.entity.TransportRequest;
import com.tasaheel.exception.BadRequestException;
import com.tasaheel.exception.ResourceNotFoundException;
import com.tasaheel.repository.DriverRepository;
import com.tasaheel.repository.TransportRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DriverService {

    private final DriverRepository driverRepository;
    private final TransportRequestRepository transportRequestRepository;
    @Autowired(required = false)
    private RedisTemplate<String, Object> redisTemplate;

    public DriverDTO getProfile(Long id) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", id));
        return toDriverDTO(driver);
    }

    public DriverDTO updateProfile(Long id, DriverDTO dto) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", id));

        if (dto.getName() != null) driver.setName(dto.getName());
        if (dto.getCity() != null) driver.setCity(dto.getCity());
        if (dto.getVehicleType() != null) driver.setVehicleType(dto.getVehicleType());
        if (dto.getServiceMode() != null) driver.setServiceMode(dto.getServiceMode());
        if (dto.getPlateNumber() != null) driver.setPlateNumber(dto.getPlateNumber());
        if (dto.getEmail() != null) driver.setEmail(dto.getEmail());
        if (dto.getFcmToken() != null) driver.setFcmToken(dto.getFcmToken());

        driver = driverRepository.save(driver);
        return toDriverDTO(driver);
    }

    public List<TransportRequestDTO> getNearbyRequests(String city, Double lat, Double lng) {
        List<TransportRequest> requests = transportRequestRepository.findByStatusOrderByCreatedAtDesc("pending");
        return requests.stream().map(this::toTransportRequestDTO).collect(Collectors.toList());
    }

    @Transactional
    public void acceptTransport(Long transportId, Long driverId) {
        TransportRequest transport = transportRequestRepository.findById(transportId)
                .orElseThrow(() -> new ResourceNotFoundException("Transport", transportId));
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", driverId));

        if (!transport.getStatus().equals("pending")) {
            throw new BadRequestException("Transport request is no longer available");
        }

        transport.setDriver(driver);
        transport.setStatus("accepted");
        transportRequestRepository.save(transport);
    }

    @Transactional
    public void rejectTransport(Long transportId, Long driverId) {
        TransportRequest transport = transportRequestRepository.findById(transportId)
                .orElseThrow(() -> new ResourceNotFoundException("Transport", transportId));

        if (transport.getDriver() == null || !transport.getDriver().getId().equals(driverId)) {
            throw new BadRequestException("You are not assigned to this transport");
        }

        transport.setStatus("pending");
        transport.setDriver(null);
        transportRequestRepository.save(transport);
    }

    @Transactional
    public void updateTransportStatus(Long transportId, String status) {
        TransportRequest transport = transportRequestRepository.findById(transportId)
                .orElseThrow(() -> new ResourceNotFoundException("Transport", transportId));

        if (status.equals("in_progress") || status.equals("en_route") || status.equals("arrived")
                || status.equals("loading") || status.equals("delivering")) {
            transport.setStatus(status);
            if (status.equals("in_progress")) {
                transport.setStartedAt(LocalDateTime.now());
            }
        } else if (status.equals("completed")) {
            transport.setStatus(status);
            transport.setCompletedAt(LocalDateTime.now());
        } else {
            throw new BadRequestException("Invalid status: " + status);
        }

        transportRequestRepository.save(transport);
    }

    @Transactional
    public void updateServiceMode(Long driverId, String serviceMode) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", driverId));
        if (!"tow_truck".equals(serviceMode) && !"mobile_mechanic".equals(serviceMode)) {
            throw new BadRequestException("Invalid service mode: " + serviceMode);
        }
        driver.setServiceMode(serviceMode);
        driverRepository.save(driver);
    }

    public void updateLocation(Long driverId, Double latitude, Double longitude) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", driverId));
        driver.setLatitude(latitude);
        driver.setLongitude(longitude);
        driverRepository.save(driver);

        if (redisTemplate != null) {
            String locationKey = "driver:location:" + driverId;
            redisTemplate.opsForValue().set(locationKey,
                    latitude + "," + longitude,
                    5, TimeUnit.MINUTES);
        }
    }

    public TransportRequestDTO getTransport(Long transportId) {
        TransportRequest transport = transportRequestRepository.findById(transportId)
                .orElseThrow(() -> new ResourceNotFoundException("Transport", transportId));
        return toTransportRequestDTO(transport);
    }

    public Map<String, Object> getDriverLocation(Long driverId) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", driverId));
        Map<String, Object> location = new java.util.HashMap<>();
        location.put("driverId", driver.getId());
        location.put("latitude", driver.getLatitude());
        location.put("longitude", driver.getLongitude());
        location.put("isOnline", driver.getIsOnline());
        location.put("updatedAt", driver.getUpdatedAt());
        return location;
    }

    public List<TransportRequestDTO> getTripHistory(Long driverId) {
        return transportRequestRepository.findByDriverIdOrderByCreatedAtDesc(driverId).stream()
                .map(this::toTransportRequestDTO)
                .collect(Collectors.toList());
    }

    private DriverDTO toDriverDTO(Driver d) {
        return DriverDTO.builder()
                .id(d.getId())
                .name(d.getName())
                .phone(d.getPhone())
                .email(d.getEmail())
                .city(d.getCity())
                .vehicleType(d.getVehicleType())
                .serviceMode(d.getServiceMode())
                .plateNumber(d.getPlateNumber())
                .isActive(d.getIsActive())
                .isApproved(d.getIsApproved())
                .latitude(d.getLatitude())
                .longitude(d.getLongitude())
                .isOnline(d.getIsOnline())
                .fcmToken(d.getFcmToken())
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .build();
    }

    private TransportRequestDTO toTransportRequestDTO(TransportRequest t) {
        return TransportRequestDTO.builder()
                .id(t.getId())
                .requestId(t.getRequest().getId())
                .customerId(t.getCustomer().getId())
                .customerName(t.getCustomer().getName())
                .customerPhone(t.getCustomer().getPhone())
                .driverId(t.getDriver() != null ? t.getDriver().getId() : null)
                .driverName(t.getDriver() != null ? t.getDriver().getName() : null)
                .pickupLat(t.getPickupLat())
                .pickupLng(t.getPickupLng())
                .pickupAddress(t.getPickupAddress())
                .dropoffLat(t.getDropoffLat())
                .dropoffLng(t.getDropoffLng())
                .dropoffAddress(t.getDropoffAddress())
                .status(t.getStatus())
                .price(t.getPrice())
                .distance(t.getDistance())
                .estimatedTime(t.getEstimatedTime())
                .startedAt(t.getStartedAt())
                .completedAt(t.getCompletedAt())
                .createdAt(t.getCreatedAt())
                .build();
    }
}
