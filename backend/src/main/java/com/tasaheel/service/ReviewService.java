package com.tasaheel.service;

import com.tasaheel.dto.ReviewDTO;
import com.tasaheel.entity.*;
import com.tasaheel.exception.BadRequestException;
import com.tasaheel.exception.ResourceNotFoundException;
import com.tasaheel.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final CustomerRepository customerRepository;
    private final WorkshopRepository workshopRepository;
    private final MaintenanceRequestRepository requestRepository;

    @Transactional
    public ReviewDTO createReview(Long customerId, ReviewDTO dto) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", customerId));
        Workshop workshop = workshopRepository.findById(dto.getWorkshopId())
                .orElseThrow(() -> new ResourceNotFoundException("Workshop", dto.getWorkshopId()));
        MaintenanceRequest request = null;
        if (dto.getRequestId() != null) {
            request = requestRepository.findById(dto.getRequestId()).orElse(null);
        }

        Review review = Review.builder()
                .request(request)
                .customer(customer)
                .workshop(workshop)
                .rating(dto.getRating())
                .comment(dto.getComment())
                .build();

        review = reviewRepository.save(review);

        Double avgRating = reviewRepository.getAverageRatingByWorkshopId(workshop.getId());
        if (avgRating != null) {
            workshop.setRating(avgRating);
            workshopRepository.save(workshop);
        }

        return toReviewDTO(review);
    }

    public Page<ReviewDTO> getReviewsByWorkshop(Long workshopId, int page, int size) {
        return reviewRepository.findByWorkshopIdOrderByCreatedAtDesc(workshopId, PageRequest.of(page, size))
                .map(this::toReviewDTO);
    }

    public List<ReviewDTO> getReviewsByCustomer(Long customerId) {
        return reviewRepository.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
                .map(this::toReviewDTO)
                .collect(Collectors.toList());
    }

    private ReviewDTO toReviewDTO(Review review) {
        return ReviewDTO.builder()
                .id(review.getId())
                .requestId(review.getRequest() != null ? review.getRequest().getId() : null)
                .customerId(review.getCustomer().getId())
                .customerName(review.getCustomer().getName())
                .customerAvatar(review.getCustomer().getAvatar())
                .workshopId(review.getWorkshop().getId())
                .workshopName(review.getWorkshop().getName())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
