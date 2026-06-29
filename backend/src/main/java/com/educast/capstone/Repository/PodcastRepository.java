package com.educast.capstone.Repository;

import com.educast.capstone.Entity.Podcast;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PodcastRepository extends JpaRepository<Podcast, Long> {
    List<Podcast> findByUserIdOrderByUploadedAtDesc(int userId);
}
