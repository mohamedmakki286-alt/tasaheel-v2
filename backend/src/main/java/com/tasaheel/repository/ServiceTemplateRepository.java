package com.tasaheel.repository;

import com.tasaheel.entity.ServiceTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceTemplateRepository extends JpaRepository<ServiceTemplate, Long> {
    List<ServiceTemplate> findByCategory_IdAndIsActiveTrueOrderByIdAsc(@Param("categoryId") Long categoryId);

    @Query("SELECT t FROM ServiceTemplate t WHERE t.category.id = :categoryId AND t.isActive = true ORDER BY t.id ASC")
    List<ServiceTemplate> findActiveByCategoryId(@Param("categoryId") Long categoryId);

    @Query("SELECT t FROM ServiceTemplate t WHERE t.isActive = true ORDER BY t.category.displayOrder ASC, t.id ASC")
    List<ServiceTemplate> findAllActive();

    @Query("SELECT t FROM ServiceTemplate t WHERE t.isActive = true AND (t.name LIKE %:search% OR t.nameEn LIKE %:search%)")
    List<ServiceTemplate> searchActive(@Param("search") String search);

    long countByCategoryIdAndIsActiveTrue(Long categoryId);
}
