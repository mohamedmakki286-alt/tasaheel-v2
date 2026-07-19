package com.tasaheel.repository;

import com.tasaheel.entity.Driver;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Long> {
    Optional<Driver> findByPhone(String phone);
    Optional<Driver> findByEmail(String email);
    boolean existsByPhone(String phone);
    boolean existsByEmail(String email);
    List<Driver> findByCityAndIsOnlineTrueAndIsApprovedTrue(String city);
    Page<Driver> findByNameContaining(String name, Pageable pageable);
}
