package com.tasaheel.repository;

import com.tasaheel.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByPhone(String phone);
    Optional<Customer> findByEmail(String email);
    boolean existsByPhone(String phone);
    boolean existsByEmail(String email);
    Page<Customer> findByNameContainingOrPhoneContaining(String name, String phone, Pageable pageable);
    Page<Customer> findByIsActive(Boolean isActive, Pageable pageable);
    Page<Customer> findByIsActiveAndNameContainingOrIsActiveAndPhoneContaining(Boolean activeByName, String name, Boolean activeByPhone, String phone, Pageable pageable);
    Optional<Customer> findByIdAndIsDeletedFalse(Long id);
    long countByIsDeletedFalse();
    @Query("SELECT c FROM Customer c WHERE c.isDeleted = false AND (:status IS NULL OR c.isActive = :status) AND (:search IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR c.phone LIKE CONCAT('%', :search, '%'))")
    Page<Customer> searchAdmin(@Param("search") String search, @Param("status") Boolean status, Pageable pageable);
}
