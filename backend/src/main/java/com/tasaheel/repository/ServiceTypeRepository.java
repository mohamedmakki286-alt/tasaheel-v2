package com.tasaheel.repository;

import com.tasaheel.entity.ServiceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceTypeRepository extends JpaRepository<ServiceType, Long> {
    List<ServiceType> findByIsActiveTrue();
    Optional<ServiceType> findByName(String name);
}
