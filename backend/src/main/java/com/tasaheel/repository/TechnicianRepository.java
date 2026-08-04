package com.tasaheel.repository;

import com.tasaheel.entity.Technician;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

@Repository
public interface TechnicianRepository extends JpaRepository<Technician, Long> {
    Optional<Technician> findByPhone(String phone);
    Optional<Technician> findByEmail(String email);
    boolean existsByPhone(String phone);
    boolean existsByEmail(String email);
    List<Technician> findByWorkshopId(Long workshopId);
    List<Technician> findByWorkshopIdAndIsOnlineTrue(Long workshopId);
    Page<Technician> findByNameContaining(String name, Pageable pageable);
    Page<Technician> findByWorkshopId(Long workshopId, Pageable pageable);
    Optional<Technician> findByIdAndWorkshopId(Long id, Long workshopId);
    @Query("SELECT t FROM Technician t WHERE (:workshopId IS NULL OR t.workshop.id = :workshopId) AND (:search IS NULL OR LOWER(t.name) LIKE LOWER(CONCAT('%', :search, '%')) OR t.phone LIKE CONCAT('%', :search, '%'))")
    Page<Technician> searchAdmin(@Param("search") String search, @Param("workshopId") Long workshopId, Pageable pageable);
}
