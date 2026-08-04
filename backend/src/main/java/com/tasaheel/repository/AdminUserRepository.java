package com.tasaheel.repository;
import com.tasaheel.entity.AdminUser; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface AdminUserRepository extends JpaRepository<AdminUser,Long> {
 Optional<AdminUser> findByEmailIgnoreCase(String email);
 Optional<AdminUser> findFirstByRoleAndIsActiveTrueOrderByIdAsc(String role);
 boolean existsByEmailIgnoreCase(String email);
}
