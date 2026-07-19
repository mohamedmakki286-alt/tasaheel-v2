package com.tasaheel.repository;

import com.tasaheel.entity.WorkshopOffer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDate;
import java.util.List;

public interface WorkshopOfferRepository extends JpaRepository<WorkshopOffer, Long> {
    List<WorkshopOffer> findByWorkshopIdOrderByCreatedAtDesc(Long workshopId);
    @Query("select o from WorkshopOffer o where o.isActive = true and (o.startDate is null or o.startDate <= :today) and (o.endDate is null or o.endDate >= :today) order by o.createdAt desc")
    List<WorkshopOffer> findPublicActive(LocalDate today);
    @Query("select o from WorkshopOffer o where o.workshop.id = :workshopId and o.isActive = true and (o.startDate is null or o.startDate <= :today) and (o.endDate is null or o.endDate >= :today) order by o.createdAt desc")
    List<WorkshopOffer> findWorkshopPublicActive(Long workshopId, LocalDate today);
}
