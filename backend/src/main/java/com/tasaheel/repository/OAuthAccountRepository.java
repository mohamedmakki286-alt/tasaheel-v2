package com.tasaheel.repository;

import com.tasaheel.entity.OAuthAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface OAuthAccountRepository extends JpaRepository<OAuthAccount, Long> {
    Optional<OAuthAccount> findByProviderAndProviderId(String provider, String providerId);
    Optional<OAuthAccount> findByProviderAndEmail(String provider, String email);
}
