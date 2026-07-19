package com.tasaheel.repository;

import com.tasaheel.entity.DeviceToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceTokenRepository extends JpaRepository<DeviceToken, Long> {
    List<DeviceToken> findByUserIdAndUserRole(Long userId, String userRole);
    Optional<DeviceToken> findByToken(String token);
    void deleteByToken(String token);
}
