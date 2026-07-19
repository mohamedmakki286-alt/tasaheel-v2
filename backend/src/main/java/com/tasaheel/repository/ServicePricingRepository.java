package com.tasaheel.repository;

import com.tasaheel.entity.ServicePricing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServicePricingRepository extends JpaRepository<ServicePricing, Long> {
    List<ServicePricing> findByServiceIdOrderByCreatedAtDesc(Long serviceId);

    @Query("SELECT sp FROM ServicePricing sp WHERE sp.service.workshop.id = :workshopId ORDER BY sp.createdAt DESC")
    List<ServicePricing> findByWorkshopId(@Param("workshopId") Long workshopId);
}
