package com.educast.capstone.Repository;

import com.educast.capstone.Entity.Podcast;
import com.educast.capstone.Entity.SavedPodcast;
import com.educast.capstone.Entity.SavedPodcastId;
import com.educast.capstone.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedPodcastRepository extends JpaRepository<SavedPodcast, SavedPodcastId> {
    List<SavedPodcast> findByUser(User user);
    Optional<SavedPodcast> findByUserAndPodcast(User user, Podcast podcast);
    boolean existsByUserAndPodcast(User user, Podcast podcast);
}
