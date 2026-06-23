package com.educast.capstone.Service;

import com.educast.capstone.Entity.Dto.PodcastDetailDto;
import com.educast.capstone.Entity.Dto.PodcastResponseDto;
import com.educast.capstone.Entity.EducationLevel;
import com.educast.capstone.Entity.Podcast;
import com.educast.capstone.Entity.Subject;
import com.educast.capstone.Entity.User;
import com.educast.capstone.Repository.PodcastRepository;
import com.educast.capstone.Service.Storage.LocalFileStorageService;
import com.educast.capstone.Util.AudioFileValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Service
public class PodcastService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    private final PodcastRepository podcastRepository;
    private final LocalFileStorageService fileStorageService;
    private final AudioMetadataService audioMetadataService;
    private final AudioFileValidator audioFileValidator;

    @Autowired
    public PodcastService(PodcastRepository podcastRepository,
                          LocalFileStorageService fileStorageService,
                          AudioMetadataService audioMetadataService,
                          AudioFileValidator audioFileValidator) {
        this.podcastRepository = podcastRepository;
        this.fileStorageService = fileStorageService;
        this.audioMetadataService = audioMetadataService;
        this.audioFileValidator = audioFileValidator;
    }

    public PodcastResponseDto upload(MultipartFile file, String title, String description,
                                     Subject subject, EducationLevel educationLevel, User author) {

        audioFileValidator.validate(file);

        String storedPath = fileStorageService.store(file, "podcasts");

        File fullFile = new File(fileStorageService.getFullPath(storedPath));
        int duration = audioMetadataService.getDurationSeconds(fullFile);

        Podcast podcast = new Podcast(title, description, storedPath,
                file.getOriginalFilename(), subject, educationLevel, author);
        podcast.setDurationSeconds(duration);
        podcast.setFileSizeBytes(file.getSize());

        Podcast saved = podcastRepository.save(podcast);

        return toDto(saved);
    }

    public List<PodcastResponseDto> getAll() {
        return podcastRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    public void delete(Long podcastId, User currentUser) {
        Podcast podcast = podcastRepository.findByIdAndAuthor(podcastId, currentUser)
                .orElseThrow(() -> new IllegalArgumentException("Podcast not found or you don't have permission to delete it"));

        fileStorageService.delete(podcast.getFilePath());
        podcastRepository.delete(podcast);
    }

    public PodcastDetailDto getById(Long id) {
        Podcast podcast = podcastRepository.findByIdWithAuthor(id)
                .orElseThrow(() -> new IllegalArgumentException("Podcast not found"));

        String audioUrl = "/api/podcasts/" + id + "/audio";

        return new PodcastDetailDto(
                podcast.getId(),
                podcast.getTitle(),
                podcast.getDescription(),
                podcast.getSubject().name(),
                podcast.getEducationLevel().name(),
                podcast.getDurationSeconds(),
                podcast.getFileSizeBytes(),
                podcast.getAuthor().getLogin(),
                podcast.getCreatedAt().toString(),
                podcast.getScore(),
                audioUrl
        );
    }

    public List<PodcastResponseDto> getPopular() {
        return podcastRepository.findTop10ByOrderByScoreDesc().stream()
                .map(this::toDto)
                .toList();
    }

    public List<PodcastResponseDto> getPopularBySubject(Subject subject) {
        return podcastRepository.findTop10BySubjectOrderByScoreDesc(subject).stream()
                .map(this::toDto)
                .toList();
    }

    public List<PodcastResponseDto> getMyPodcasts(User currentUser) {
        return podcastRepository.findByAuthorOrderByCreatedAtDesc(currentUser).stream()
                .map(this::toDto)
                .toList();
    }



    public byte[] getAudioFile(Long id) {
        Podcast podcast = podcastRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Podcast not found"));

        try {
            Path filePath = Paths.get(uploadDir, podcast.getFilePath());
            return Files.readAllBytes(filePath);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read audio file", e);
        }
    }

    public String getContentType(Long id) {
        Podcast podcast = podcastRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Podcast not found"));

        String filename = podcast.getOriginalFileName();
        if (filename == null) return "audio/mpeg";

        if (filename.endsWith(".mp3")) return "audio/mpeg";
        if (filename.endsWith(".ogg")) return "audio/ogg";
        if (filename.endsWith(".wav")) return "audio/wav";
        if (filename.endsWith(".m4a")) return "audio/mp4";
        if (filename.endsWith(".aac")) return "audio/aac";

        return "audio/mpeg";
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