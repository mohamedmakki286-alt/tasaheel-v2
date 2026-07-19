package com.tasaheel.controller;

import com.tasaheel.dto.*;
import com.tasaheel.entity.*;
import com.tasaheel.repository.*;
import com.tasaheel.security.UserDetailsImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController @RequestMapping("/api") @RequiredArgsConstructor @CrossOrigin(origins = "*")
public class WorkshopOfferController {
    private final WorkshopOfferRepository repository;
    private final WorkshopRepository workshopRepository;

    @GetMapping("/offers")
    public ApiResponse<List<WorkshopOfferDTO>> publicOffers() {
        return ApiResponse.success(repository.findPublicActive(LocalDate.now()).stream().map(this::dto).toList());
    }

    @GetMapping("/admin/offers") @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<WorkshopOfferDTO>> adminOffers() {
        return ApiResponse.success(repository.findAll().stream().map(this::dto).toList());
    }

    @PatchMapping("/admin/offers/{id}/status") @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<WorkshopOfferDTO> adminStatus(@PathVariable Long id, @RequestBody java.util.Map<String, Boolean> body) {
        WorkshopOffer offer = repository.findById(id).orElseThrow();
        offer.setIsActive(Boolean.TRUE.equals(body.get("isActive")));
        return ApiResponse.success(dto(repository.save(offer)));
    }

    @DeleteMapping("/admin/offers/{id}") @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> adminDelete(@PathVariable Long id) {
        repository.deleteById(id);
        return ApiResponse.success(null);
    }

    @GetMapping("/workshops/{workshopId}/offers")
    public ApiResponse<List<WorkshopOfferDTO>> workshopOffers(@PathVariable Long workshopId) {
        return ApiResponse.success(repository.findWorkshopPublicActive(workshopId, LocalDate.now()).stream().map(this::dto).toList());
    }

    @GetMapping("/workshops/my/offers") @PreAuthorize("hasRole('WORKSHOP')")
    public ApiResponse<List<WorkshopOfferDTO>> myOffers(@AuthenticationPrincipal UserDetailsImpl user) {
        return ApiResponse.success(repository.findByWorkshopIdOrderByCreatedAtDesc(user.getUserId()).stream().map(this::dto).toList());
    }

    @PostMapping("/workshops/my/offers") @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<WorkshopOfferDTO>> create(@AuthenticationPrincipal UserDetailsImpl user, @Valid @RequestBody WorkshopOfferRequest req) {
        Workshop workshop = workshopRepository.findById(user.getUserId()).orElseThrow();
        WorkshopOffer offer = WorkshopOffer.builder().workshop(workshop).build();
        apply(offer, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(dto(repository.save(offer))));
    }

    @PutMapping("/workshops/my/offers/{id}") @PreAuthorize("hasRole('WORKSHOP')")
    public ApiResponse<WorkshopOfferDTO> update(@AuthenticationPrincipal UserDetailsImpl user, @PathVariable Long id, @Valid @RequestBody WorkshopOfferRequest req) {
        WorkshopOffer offer = repository.findById(id).filter(o -> o.getWorkshop().getId().equals(user.getUserId())).orElseThrow();
        apply(offer, req);
        return ApiResponse.success(dto(repository.save(offer)));
    }

    @DeleteMapping("/workshops/my/offers/{id}") @PreAuthorize("hasRole('WORKSHOP')")
    public ApiResponse<Void> delete(@AuthenticationPrincipal UserDetailsImpl user, @PathVariable Long id) {
        WorkshopOffer offer = repository.findById(id).filter(o -> o.getWorkshop().getId().equals(user.getUserId())).orElseThrow();
        repository.delete(offer);
        return ApiResponse.success(null);
    }

    private void apply(WorkshopOffer o, WorkshopOfferRequest r) {
        o.setTitle(r.getTitle()); o.setDescription(r.getDescription());
        o.setType(r.getType() == null ? "package" : r.getType()); o.setServiceNames(r.getServiceNames());
        o.setOriginalPrice(r.getOriginalPrice()); o.setOfferPrice(r.getOfferPrice());
        o.setStartDate(r.getStartDate()); o.setEndDate(r.getEndDate());
        o.setIsActive(r.getIsActive() == null || r.getIsActive());
    }

    private WorkshopOfferDTO dto(WorkshopOffer o) {
        int discount = o.getOriginalPrice() != null && o.getOriginalPrice() > 0 && o.getOfferPrice() != null
                ? (int)Math.round((1 - o.getOfferPrice() / o.getOriginalPrice()) * 100) : 0;
        return WorkshopOfferDTO.builder().id(o.getId()).workshopId(o.getWorkshop().getId()).workshopName(o.getWorkshop().getName())
                .workshopRating(o.getWorkshop().getRating()).workshopCity(o.getWorkshop().getCity()).title(o.getTitle())
                .description(o.getDescription()).type(o.getType()).serviceNames(o.getServiceNames()).originalPrice(o.getOriginalPrice())
                .offerPrice(o.getOfferPrice()).discountPercent(Math.max(discount, 0)).startDate(o.getStartDate()).endDate(o.getEndDate()).isActive(o.getIsActive()).build();
    }
}
