package com.educast.capstone.Repository;

import com.educast.capstone.Entity.Podcast;
import com.educast.capstone.Entity.PodcastVote;
import com.educast.capstone.Entity.PodcastVoteId;
import com.educast.capstone.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PodcastVoteRepository extends JpaRepository<PodcastVote, PodcastVoteId> {
    Optional<PodcastVote> findByUserAndPodcast(User user, Podcast podcast);
}
