package com.tasaheel.repository;

import com.tasaheel.entity.Media;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MediaRepository extends JpaRepository<Media, Long> {
    List<Media> findByRequestIdOrderByCreatedAtAsc(Long requestId);
    void deleteByRequestId(Long requestId);
}
