package com.tasaheel.repository;

import com.tasaheel.entity.WorkshopServiceListing;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkshopServiceListingRepository extends JpaRepository<WorkshopServiceListing, Long> {
    Optional<WorkshopServiceListing> findByUuid(String uuid);

    @Query("SELECT s FROM WorkshopServiceListing s WHERE s.workshop.id = :workshopId AND s.isDeleted = false ORDER BY s.displayOrder ASC")
    List<WorkshopServiceListing> findByWorkshopId(@Param("workshopId") Long workshopId);

    @Query("SELECT s FROM WorkshopServiceListing s WHERE s.workshop.id = :workshopId AND s.isDeleted = false AND s.isVisible = true")
    List<WorkshopServiceListing> findVisibleByWorkshopId(@Param("workshopId") Long workshopId);

    @Query("SELECT s FROM WorkshopServiceListing s WHERE s.workshop.id = :workshopId AND s.isDeleted = false AND s.isVisible = true AND s.isAvailable = true")
    List<WorkshopServiceListing> findAvailableByWorkshopId(@Param("workshopId") Long workshopId);

    @Query("SELECT s FROM WorkshopServiceListing s WHERE s.workshop.id = :workshopId AND s.isDeleted = false AND s.name LIKE %:search%")
    Page<WorkshopServiceListing> searchByWorkshopId(@Param("workshopId") Long workshopId, @Param("search") String search, Pageable pageable);

    @Query("SELECT s FROM WorkshopServiceListing s WHERE s.workshop.id = :workshopId AND s.isDeleted = false AND s.category.id = :categoryId")
    List<WorkshopServiceListing> findByWorkshopIdAndCategoryId(@Param("workshopId") Long workshopId, @Param("categoryId") Long categoryId);

    @Query("SELECT COUNT(s) FROM WorkshopServiceListing s WHERE s.isDeleted = false")
    long countActive();

    @Query("SELECT s FROM WorkshopServiceListing s WHERE s.isDeleted = false")
    Page<WorkshopServiceListing> findAllActive(Pageable pageable);

    @Query("SELECT s FROM WorkshopServiceListing s WHERE s.isDeleted = false AND s.name LIKE %:search%")
    Page<WorkshopServiceListing> searchAllActive(@Param("search") String search, Pageable pageable);

    @Query("SELECT COALESCE(MAX(s.displayOrder), 0) FROM WorkshopServiceListing s WHERE s.workshop.id = :workshopId AND s.isDeleted = false")
    Integer findMaxDisplayOrder(@Param("workshopId") Long workshopId);

    @Query("SELECT COUNT(DISTINCT s.workshop.id) FROM WorkshopServiceListing s WHERE s.category.id = :categoryId AND s.isDeleted = false AND s.isVisible = true")
    long countWorkshopsByCategoryId(@Param("categoryId") Long categoryId);

    @Query("SELECT COUNT(s) FROM WorkshopServiceListing s WHERE s.serviceTemplate.id = :templateId AND s.isDeleted = false AND s.isVisible = true AND s.isAvailable = true")
    long countByServiceTemplateIdAndAvailable(@Param("templateId") Long templateId);

    @Query("SELECT s FROM WorkshopServiceListing s WHERE s.serviceTemplate.id = :templateId AND s.isDeleted = false AND s.isVisible = true AND s.isAvailable = true")
    List<WorkshopServiceListing> findByServiceTemplateIdAndVisibleAndAvailable(@Param("templateId") Long templateId);
}
