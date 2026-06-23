package com.educast.capstone.Service;

import com.educast.capstone.Entity.Dto.PodcastResponseDto;
import com.educast.capstone.Entity.Podcast;
import com.educast.capstone.Entity.SavedPodcast;
import com.educast.capstone.Entity.User;
import com.educast.capstone.Repository.PodcastRepository;
import com.educast.capstone.Repository.SavedPodcastRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class SavedPodcastService {

    private final SavedPodcastRepository savedPodcastRepository;
    private final PodcastRepository podcastRepository;

    @Autowired
    public SavedPodcastService(SavedPodcastRepository savedPodcastRepository,
                               PodcastRepository podcastRepository) {
        this.savedPodcastRepository = savedPodcastRepository;
        this.podcastRepository = podcastRepository;
    }

    public String toggleSave(Long podcastId, User currentUser) {
        Podcast podcast = podcastRepository.findById(podcastId)
                .orElseThrow(() -> new IllegalArgumentException("Podcast not found"));

        Optional<SavedPodcast> existing = savedPodcastRepository.findByUserAndPodcast(currentUser, podcast);

        if (existing.isPresent()) {
            savedPodcastRepository.delete(existing.get());
            return "Podcast removed from saved";
        } else {
            savedPodcastRepository.save(new SavedPodcast(currentUser, podcast));
            return "Podcast saved";
        }
    }

    public List<PodcastResponseDto> getSavedPodcasts(User currentUser) {
        return savedPodcastRepository.findByUser(currentUser).stream()
                .map(saved -> {
                    Podcast p = saved.getPodcast();
                    return new PodcastResponseDto(
                            p.getId(), p.getTitle(), p.getDescription(),
                            p.getSubject().name(), p.getEducationLevel().name(),
                            p.getDurationSeconds(), p.getFileSizeBytes(),
                            p.getAuthor().getLogin(), p.getCreatedAt().toString(), p.getScore()
                    );
                })
                .toList();
    }
}