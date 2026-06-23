package com.educast.capstone.Service;

import com.educast.capstone.Entity.Dto.PodcastResponseDto;
import com.educast.capstone.Entity.Podcast;
import com.educast.capstone.Repository.PodcastRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SearchService {

    private final PodcastRepository podcastRepository;

    @Autowired
    public SearchService(PodcastRepository podcastRepository) {
        this.podcastRepository = podcastRepository;
    }

    public List<PodcastResponseDto> search(String query, String subject, String educationLevel) {
        // передаём null если пустая строка — чтобы SQL-условие IS NULL сработало
        String normalizedQuery = (query == null || query.isBlank()) ? null : query.trim();
        String normalizedSubject = (subject == null || subject.isBlank()) ? null : subject.trim();
        String normalizedLevel = (educationLevel == null || educationLevel.isBlank()) ? null : educationLevel.trim();

        List<Podcast> results = podcastRepository.search(normalizedQuery, normalizedSubject, normalizedLevel);

        return results.stream()
                .map(this::toDto)
                .toList();
    }

    private PodcastResponseDto toDto(Podcast podcast) {
        return new PodcastResponseDto(
                podcast.getId(),
                podcast.getTitle(),
                podcast.getDescription(),
                podcast.getSubject().name(),
                podcast.getEducationLevel().name(),
                podcast.getDurationSeconds(),
                podcast.getFileSizeBytes(),
                podcast.getAuthor().getLogin(),
                podcast.getCreatedAt().toString(),
                podcast.getScore()
        );
    }
}
