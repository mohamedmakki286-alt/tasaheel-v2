package com.tasaheel.controller;
import com.tasaheel.dto.ApiResponse; import com.tasaheel.service.*; import lombok.RequiredArgsConstructor; import org.springframework.http.*; import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequestMapping("/api/admin/support-agents") @RequiredArgsConstructor @CrossOrigin(origins="*")
public class SupportAgentAdminController {
 private final SupportAgentService service; private final AuthService auth;
 @GetMapping public ResponseEntity<ApiResponse<List<Map<String,Object>>>> list(){return ResponseEntity.ok(ApiResponse.success(service.list()));}
 @PostMapping public ResponseEntity<ApiResponse<Map<String,Object>>> create(@RequestBody Map<String,String>b){return ResponseEntity.status(201).body(ApiResponse.success(service.create(b)));}
 @PutMapping("/{id}") public ResponseEntity<ApiResponse<Map<String,Object>>> update(@PathVariable Long id,@RequestBody Map<String,String>b){return ResponseEntity.ok(ApiResponse.success(service.update(id,b)));}
 @PostMapping("/{id}/invitation") public ResponseEntity<ApiResponse<Map<String,Object>>> invite(@PathVariable Long id){return ResponseEntity.ok(ApiResponse.success(auth.createSupportAgentInvitation(id)));}
}
