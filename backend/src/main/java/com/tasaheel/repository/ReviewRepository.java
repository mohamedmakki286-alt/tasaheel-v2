package com.tasaheel.repository;

import com.tasaheel.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    Page<Review> findByWorkshopIdOrderByCreatedAtDesc(Long workshopId, Pageable pageable);
    List<Review> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.workshop.id = :workshopId")
    Double getAverageRatingByWorkshopId(Long workshopId);
    long countByWorkshopId(Long workshopId);
}
