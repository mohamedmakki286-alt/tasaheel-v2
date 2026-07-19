package com.tasaheel.repository;

import com.tasaheel.entity.Quote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface QuoteRepository extends JpaRepository<Quote, Long> {
    List<Quote> findByRequestIdOrderByCreatedAtAsc(Long requestId);
    List<Quote> findByWorkshopIdOrderByCreatedAtDesc(Long workshopId);
    List<Quote> findByRequestIdAndWorkshopId(Long requestId, Long workshopId);
    Optional<Quote> findByRequestIdAndStatus(Long requestId, String status);
    long countByWorkshopId(Long workshopId);

    List<Quote> findByRequestIdAndServiceTypeIsNotNull(Long requestId);

    List<Quote> findByRequestIdAndServiceTypeIsNull(Long requestId);

    @Query("SELECT q FROM Quote q WHERE q.request.id = ?1 AND q.serviceType.id = ?2")
    List<Quote> findByRequestIdAndServiceTypeId(Long requestId, Long serviceTypeId);

    @Query("SELECT q.createdAt, q.request.createdAt FROM Quote q WHERE q.workshop.id = ?1 AND q.status = 'accepted'")
    List<Object[]> findAcceptedQuoteTimesByWorkshopId(Long workshopId);
}
