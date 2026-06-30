package com.educast.capstone.Service;

import com.educast.capstone.Entity.Podcast;
import com.educast.capstone.Entity.PodcastVote;
import com.educast.capstone.Entity.User;
import com.educast.capstone.Repository.PodcastRepository;
import com.educast.capstone.Repository.PodcastVoteRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@Transactional
public class VoteService {

    private final PodcastVoteRepository voteRepository;
    private final PodcastRepository podcastRepository;

    @Autowired
    public VoteService(PodcastVoteRepository voteRepository, PodcastRepository podcastRepository) {
        this.voteRepository = voteRepository;
        this.podcastRepository = podcastRepository;
    }

    public int vote(Long podcastId, int voteValue, User currentUser) {
        Podcast podcast = podcastRepository.findById(podcastId)
                .orElseThrow(() -> new IllegalArgumentException("Podcast not found"));

        Optional<PodcastVote> existingVote = voteRepository.findByUserAndPodcast(currentUser, podcast);

        if (existingVote.isPresent()) {
            PodcastVote pv = existingVote.get();
            if (pv.getVote() == voteValue) {
                // Vote repeated = remove vote
                podcast.setScore(podcast.getScore() - voteValue);
                voteRepository.delete(pv);
            } else {
                // Vote opposite = remove old vote and put new
                podcast.setScore(podcast.getScore() - pv.getVote() + voteValue);
                pv.setVote(voteValue);
                voteRepository.save(pv);
            }
        } else {
            podcast.setScore(podcast.getScore() + voteValue);
            voteRepository.save(new PodcastVote(currentUser, podcast, voteValue));
        }

        podcastRepository.save(podcast);
        return podcast.getScore();
    }
}
