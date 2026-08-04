package com.tasaheel.controller;
import com.tasaheel.dto.ApiResponse; import com.tasaheel.security.UserDetailsImpl; import com.tasaheel.service.SupportService;
import lombok.RequiredArgsConstructor; import org.springframework.http.*; import org.springframework.security.core.annotation.AuthenticationPrincipal; import org.springframework.web.bind.annotation.*; import org.springframework.web.multipart.MultipartFile; import java.util.*;
import org.springframework.security.access.prepost.PreAuthorize;
@RestController @RequestMapping("/api/support") @RequiredArgsConstructor @CrossOrigin(origins="*")
public class SupportController {
 private final SupportService service;
 @GetMapping("/tickets") public ResponseEntity<ApiResponse<List<Map<String,Object>>>> list(@AuthenticationPrincipal UserDetailsImpl u){return ResponseEntity.ok(ApiResponse.success(service.list(u)));}
 @PreAuthorize("hasRole('CUSTOMER')") @PostMapping(value="/tickets",consumes=MediaType.MULTIPART_FORM_DATA_VALUE) public ResponseEntity<ApiResponse<Map<String,Object>>> create(@AuthenticationPrincipal UserDetailsImpl u,@RequestParam String subject,@RequestParam String message,@RequestParam(defaultValue="general") String category,@RequestParam(required=false) Long requestId,@RequestParam(required=false) MultipartFile file){return ResponseEntity.status(201).body(ApiResponse.success(service.create(u.getUserId(),new HashMap<>(Map.of("subject",subject,"message",message,"category",category,"requestId",requestId==null?"":requestId.toString())),file)));}
 @GetMapping("/tickets/{id}") public ResponseEntity<ApiResponse<Map<String,Object>>> get(@AuthenticationPrincipal UserDetailsImpl u,@PathVariable Long id){return ResponseEntity.ok(ApiResponse.success(service.get(id,u)));}
 @PostMapping(value="/tickets/{id}/messages",consumes=MediaType.MULTIPART_FORM_DATA_VALUE) public ResponseEntity<ApiResponse<Map<String,Object>>> send(@AuthenticationPrincipal UserDetailsImpl u,@PathVariable Long id,@RequestParam(defaultValue="") String message,@RequestParam(required=false) MultipartFile file){return ResponseEntity.ok(ApiResponse.success(service.send(id,u,message,file)));}
 @PreAuthorize("hasAnyRole('SUPPORT_AGENT','ADMIN')") @PutMapping("/tickets/{id}/status") public ResponseEntity<ApiResponse<Map<String,Object>>> status(@AuthenticationPrincipal UserDetailsImpl u,@PathVariable Long id,@RequestBody Map<String,String> b){return ResponseEntity.ok(ApiResponse.success(service.changeStatus(id,u,b.get("status"),b.get("note"))));}
}
