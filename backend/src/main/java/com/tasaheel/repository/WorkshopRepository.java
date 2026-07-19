package com.tasaheel.repository;

import com.tasaheel.entity.Workshop;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface WorkshopRepository extends JpaRepository<Workshop, Long> {
    Optional<Workshop> findByPhone(String phone);
    Optional<Workshop> findByEmail(String email);
    boolean existsByPhone(String phone);
    boolean existsByEmail(String email);
    List<Workshop> findByCityAndIsApprovedTrue(String city);
    List<Workshop> findByIsApproved(Boolean isApproved);
    List<Workshop> findByIsApprovedAndIsActive(Boolean isApproved, Boolean isActive);
    List<Workshop> findByCityAndIsApprovedAndIsActive(String city, Boolean isApproved, Boolean isActive);
    Page<Workshop> findByNameContainingOrCityContaining(String name, String city, Pageable pageable);
    List<Workshop> findByCityAndWorkshopTypeIn(String city, List<String> workshopTypes);
}
