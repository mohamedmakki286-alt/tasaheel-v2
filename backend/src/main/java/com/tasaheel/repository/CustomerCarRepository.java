package com.tasaheel.repository;

import com.tasaheel.entity.CustomerCar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CustomerCarRepository extends JpaRepository<CustomerCar, Long> {
    List<CustomerCar> findByCustomerId(Long customerId);
    void deleteByCustomerId(Long customerId);
}
