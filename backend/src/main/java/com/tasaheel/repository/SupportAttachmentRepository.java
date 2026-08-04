package com.tasaheel.repository;
import com.tasaheel.entity.SupportAttachment; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface SupportAttachmentRepository extends JpaRepository<SupportAttachment,Long> { List<SupportAttachment> findByMessageId(Long messageId); }
