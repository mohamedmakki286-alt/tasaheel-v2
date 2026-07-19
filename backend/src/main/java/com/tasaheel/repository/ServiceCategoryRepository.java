package com.tasaheel.repository;

import com.tasaheel.entity.ServiceCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceCategoryRepository extends JpaRepository<ServiceCategory, Long> {
    List<ServiceCategory> findByIsActiveTrueOrderByDisplayOrderAsc();
    List<ServiceCategory> findAllByOrderByDisplayOrderAsc();
    boolean existsByNameIgnoreCase(String name);
    Optional<ServiceCategory> findByNameIgnoreCase(String name);
    Optional<ServiceCategory> findByNameEnIgnoreCase(String nameEn);
}
