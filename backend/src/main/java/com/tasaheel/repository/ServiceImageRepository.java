package com.tasaheel.repository;

import com.tasaheel.entity.ServiceImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceImageRepository extends JpaRepository<ServiceImage, Long> {
    List<ServiceImage> findByServiceIdOrderByDisplayOrderAsc(Long serviceId);
    void deleteByServiceId(Long serviceId);
    long countByServiceId(Long serviceId);
}
