package com.tasaheel.repository;

import com.tasaheel.entity.WorkshopGallery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface WorkshopGalleryRepository extends JpaRepository<WorkshopGallery, Long> {
    List<WorkshopGallery> findByWorkshopIdAndIsDeletedFalseOrderByDisplayOrderAsc(Long workshopId);
    List<WorkshopGallery> findByWorkshopIdAndIsDeletedFalseAndIsCoverTrue(Long workshopId);
    void deleteByWorkshopId(Long workshopId);
}
