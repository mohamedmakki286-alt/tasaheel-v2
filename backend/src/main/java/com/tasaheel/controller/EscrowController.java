package com.tasaheel.controller;

import com.tasaheel.dto.ApiResponse;
import com.tasaheel.entity.PaymentHold;
import com.tasaheel.security.UserDetailsImpl;
import com.tasaheel.service.EscrowService;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/escrow")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EscrowController {

    private final EscrowService escrowService;
    private final MessageSource msg;

    @PostMapping("/{requestId}/hold")
    public ResponseEntity<ApiResponse<PaymentHold>> holdPayment(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long requestId) {
        Locale locale = LocaleContextHolder.getLocale();
        PaymentHold hold = escrowService.holdPayment(requestId, user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("payment.held", null, locale), hold));
    }

    @GetMapping("/{requestId}")
    public ResponseEntity<ApiResponse<PaymentHold>> getHold(@PathVariable Long requestId) {
        PaymentHold hold = escrowService.getHoldByRequest(requestId);
        return ResponseEntity.ok(ApiResponse.success(hold));
    }
}
