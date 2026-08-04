package com.tasaheel.service;

import com.tasaheel.entity.*;
import com.tasaheel.exception.*;
import com.tasaheel.integration.MediaService;
import com.tasaheel.integration.FirebaseService;
import com.tasaheel.repository.*;
import com.tasaheel.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import java.time.LocalDateTime;
import java.util.*;

@Service @RequiredArgsConstructor
public class SupportService {
 private static final Set<String> STATUSES=Set.of("new","in_progress","waiting_customer","resolved","closed");
 private final SupportTicketRepository tickets; private final SupportMessageRepository messages;
 private final SupportAttachmentRepository attachments; private final SupportStatusHistoryRepository history;
 private final CustomerRepository customers; private final AdminUserRepository agents;
 private final MaintenanceRequestRepository requests; private final MediaService media; private final NotificationService notifications;
 private final FirebaseService firebase; private final SimpMessagingTemplate messaging;

 @Transactional public Map<String,Object> create(Long customerId, Map<String,Object> body, MultipartFile file) {
  Customer customer=customers.findById(customerId).orElseThrow(()->new ResourceNotFoundException("Customer",customerId));
  String subject=Objects.toString(body.get("subject"),"").trim(); String text=Objects.toString(body.get("message"),"").trim();
  if(subject.isBlank()||text.isBlank()) throw new BadRequestException("Subject and message are required");
  MaintenanceRequest request=null; Object rid=body.get("requestId");
  if(rid!=null&&!rid.toString().isBlank()){ Long id=Long.valueOf(rid.toString()); if(!requests.isOwnedByCustomer(id,customerId)) throw new UnauthorizedException("Request does not belong to customer"); request=requests.findById(id).orElseThrow(()->new ResourceNotFoundException("Request",id)); }
  AdminUser agent=agents.findFirstByRoleAndIsActiveTrueOrderByIdAsc("support_agent").orElse(null);
  SupportTicket ticket=tickets.save(SupportTicket.builder().customer(customer).assignedAgent(agent).request(request).subject(subject)
    .category(Objects.toString(body.getOrDefault("category","general"))).priority(Objects.toString(body.getOrDefault("priority","normal")))
    .status("new").lastMessageAt(LocalDateTime.now()).agentUnreadCount(1).build());
  ticket.setTicketNumber("TS-"+LocalDateTime.now().getYear()+"-"+String.format("%06d",ticket.getId())); tickets.save(ticket);
  addMessage(ticket,customerId,"customer",text,file); history.save(SupportStatusHistory.builder().ticket(ticket).newStatus("new").changedById(customerId).changedByRole("customer").build());
  if(agent!=null) notifications.save(agent.getId(),"support_agent","support","تذكرة دعم جديدة",subject,request==null?null:request.getId(),"support_ticket_created");
  messaging.convertAndSend("/topic/admin",Map.of("type","SUPPORT_TICKET_CREATED","ticketId",ticket.getId(),"payload",Map.of("subject",subject,"customerName",customer.getName())));
  return detail(ticket,"customer",customerId);
 }
 public List<Map<String,Object>> list(UserDetailsImpl user){
  List<SupportTicket> list="customer".equals(user.getRole())?tickets.findByCustomerIdOrderByLastMessageAtDesc(user.getUserId()):tickets.findAllByOrderByLastMessageAtDesc();
  return list.stream().filter(t->canAccess(t,user)).map(t->summary(t,user.getRole())).toList();
 }
 @Transactional public Map<String,Object> get(Long id,UserDetailsImpl user){ SupportTicket t=findAllowed(id,user); if("customer".equals(user.getRole()))t.setCustomerUnreadCount(0);else t.setAgentUnreadCount(0); tickets.save(t); return detail(t,user.getRole(),user.getUserId()); }
 @Transactional public Map<String,Object> send(Long id,UserDetailsImpl user,String text,MultipartFile file){ SupportTicket t=findAllowed(id,user); if("closed".equals(t.getStatus()))throw new BadRequestException("Closed ticket cannot receive messages"); text=text==null?"":text.trim(); if(text.isBlank()&&(file==null||file.isEmpty()))throw new BadRequestException("Message or attachment is required");
  addMessage(t,user.getUserId(),user.getRole(),text,file); t.setLastMessageAt(LocalDateTime.now());
  if("customer".equals(user.getRole())){t.setAgentUnreadCount(t.getAgentUnreadCount()+1); if("waiting_customer".equals(t.getStatus()))t.setStatus("in_progress"); if(t.getAssignedAgent()!=null)notifications.save(t.getAssignedAgent().getId(),"support_agent","support","رسالة دعم جديدة",t.getSubject(),t.getRequest()==null?null:t.getRequest().getId(),"support_message");}
  else {t.setCustomerUnreadCount(t.getCustomerUnreadCount()+1); notifications.save(t.getCustomer().getId(),"customer","support","رد خدمة العملاء",t.getSubject(),t.getRequest()==null?null:t.getRequest().getId(),"support_message");notifyCustomer(t,"رد جديد من خدمة العملاء","تم الرد على: "+t.getSubject(),"SUPPORT_MESSAGE");}
  tickets.save(t); return detail(t,user.getRole(),user.getUserId()); }
 @Transactional public Map<String,Object> changeStatus(Long id,UserDetailsImpl user,String status,String note){ if("customer".equals(user.getRole()))throw new UnauthorizedException("Support role required"); status=status==null?"":status.toLowerCase(); if(!STATUSES.contains(status))throw new BadRequestException("Invalid support status"); SupportTicket t=findAllowed(id,user); String old=t.getStatus(); t.setStatus(status); if("closed".equals(status))t.setClosedAt(LocalDateTime.now()); else t.setClosedAt(null); tickets.save(t); history.save(SupportStatusHistory.builder().ticket(t).oldStatus(old).newStatus(status).changedById(user.getUserId()).changedByRole(user.getRole()).note(note).build()); notifications.save(t.getCustomer().getId(),"customer","support","تحديث تذكرة الدعم",t.getSubject(),t.getRequest()==null?null:t.getRequest().getId(),"support_status");notifyCustomer(t,"تحديث تذكرة الدعم","الحالة الجديدة: "+status,"SUPPORT_STATUS"); return detail(t,user.getRole(),user.getUserId()); }
 private void notifyCustomer(SupportTicket t,String title,String body,String type){messaging.convertAndSend("/topic/customer/"+t.getCustomer().getId(),Map.of("type",type,"ticketId",t.getId(),"payload",Map.of("title",title,"body",body)));if(t.getCustomer().getFcmToken()!=null)firebase.sendNotification(t.getCustomer().getFcmToken(),title,body,Map.of("type",type,"ticketId",String.valueOf(t.getId())));}
 private SupportMessage addMessage(SupportTicket t,Long uid,String role,String body,MultipartFile file){ SupportMessage m=messages.save(SupportMessage.builder().ticket(t).senderId(uid).senderRole(role).body(body).build()); if(file!=null&&!file.isEmpty()){media.validateFile(file);String url=media.storeFile(file,"support");attachments.save(SupportAttachment.builder().message(m).fileUrl(url).fileName(Optional.ofNullable(file.getOriginalFilename()).orElse("attachment")).mimeType(Optional.ofNullable(file.getContentType()).orElse("application/octet-stream")).fileSize(file.getSize()).build());}return m; }
 private SupportTicket findAllowed(Long id,UserDetailsImpl u){SupportTicket t=tickets.findById(id).orElseThrow(()->new ResourceNotFoundException("Support ticket",id));if(!canAccess(t,u))throw new UnauthorizedException("Ticket access denied");return t;}
 private boolean canAccess(SupportTicket t,UserDetailsImpl u){return "admin".equals(u.getRole())||("customer".equals(u.getRole())&&t.getCustomer().getId().equals(u.getUserId()))||("support_agent".equals(u.getRole())&&t.getAssignedAgent()!=null&&t.getAssignedAgent().getId().equals(u.getUserId()));}
 private Map<String,Object> summary(SupportTicket t,String role){Map<String,Object> m=new LinkedHashMap<>();m.put("id",t.getId());m.put("ticketNumber",t.getTicketNumber());m.put("subject",t.getSubject());m.put("category",t.getCategory());m.put("priority",t.getPriority());m.put("status",t.getStatus());m.put("lastMessageAt",t.getLastMessageAt());m.put("createdAt",t.getCreatedAt());m.put("unreadCount","customer".equals(role)?t.getCustomerUnreadCount():t.getAgentUnreadCount());m.put("customer",Map.of("id",t.getCustomer().getId(),"name",t.getCustomer().getName(),"phone",t.getCustomer().getPhone()));m.put("assignedAgent",t.getAssignedAgent()==null?null:Map.of("id",t.getAssignedAgent().getId(),"name",t.getAssignedAgent().getName()));m.put("requestId",t.getRequest()==null?null:t.getRequest().getId());return m;}
 private Map<String,Object> detail(SupportTicket t,String role,Long uid){Map<String,Object> out=summary(t,role);List<Map<String,Object>> ms=new ArrayList<>();for(SupportMessage x:messages.findByTicketIdOrderByCreatedAtAsc(t.getId())){Map<String,Object> mm=new LinkedHashMap<>();mm.put("id",x.getId());mm.put("body",x.getBody());mm.put("senderId",x.getSenderId());mm.put("senderRole",x.getSenderRole());mm.put("mine",x.getSenderId().equals(uid)&&x.getSenderRole().equals(role));mm.put("createdAt",x.getCreatedAt());mm.put("attachments",attachments.findByMessageId(x.getId()).stream().map(a->Map.of("id",a.getId(),"url",a.getFileUrl(),"fileName",a.getFileName(),"mimeType",a.getMimeType(),"size",a.getFileSize())).toList());ms.add(mm);}out.put("messages",ms);out.put("history",history.findByTicketIdOrderByCreatedAtAsc(t.getId()).stream().map(h->{Map<String,Object> v=new LinkedHashMap<>();v.put("id",h.getId());v.put("oldStatus",h.getOldStatus());v.put("newStatus",h.getNewStatus());v.put("changedByRole",h.getChangedByRole());v.put("note",h.getNote());v.put("createdAt",h.getCreatedAt());return v;}).toList());return out;}
}
