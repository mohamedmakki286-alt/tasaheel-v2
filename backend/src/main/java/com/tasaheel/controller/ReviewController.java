package com.tasaheel.controller;

import com.tasaheel.dto.*;
import com.tasaheel.security.UserDetailsImpl;
import com.tasaheel.service.ReviewService;
import jakarta.validation.Valid;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReviewController {

    private final ReviewService reviewService;
    private final MessageSource msg;

    @PostMapping
    public ResponseEntity<ApiResponse<ReviewDTO>> createReview(
            @AuthenticationPrincipal UserDetailsImpl user,
            @Valid @RequestBody ReviewDTO dto) {
        Locale locale = LocaleContextHolder.getLocale();
        ReviewDTO review = reviewService.createReview(user.getUserId(), dto);
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("review.created", null, locale), review));
    }

    @GetMapping("/workshop/{workshopId}")
    public ResponseEntity<ApiResponse<Page<ReviewDTO>>> getWorkshopReviews(
            @PathVariable Long workshopId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<ReviewDTO> reviews = reviewService.getReviewsByWorkshop(workshopId, page, size);
        return ResponseEntity.ok(ApiResponse.success(reviews));
    }

    @GetMapping("/customer")
    public ResponseEntity<ApiResponse<List<ReviewDTO>>> getCustomerReviews(
            @AuthenticationPrincipal UserDetailsImpl user) {
        List<ReviewDTO> reviews = reviewService.getReviewsByCustomer(user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(reviews));
    }
}
