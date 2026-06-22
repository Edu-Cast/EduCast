package com.educast.capstone.Repository;

import com.educast.capstone.Entity.Podcast;
import com.educast.capstone.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PodcastRepository extends JpaRepository<Podcast, Long> {
    List<Podcast> findByAuthor(User author);
    Optional<Podcast> findByIdAndAuthor(Long id, User author);
}