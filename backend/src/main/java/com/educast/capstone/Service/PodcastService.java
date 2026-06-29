package com.educast.capstone.Service;

import com.educast.capstone.Configuration.MlServiceClient;
import com.educast.capstone.Entity.Dto.MlServiceResponse;
import com.educast.capstone.Entity.Dto.PodcastResponseDto;
import com.educast.capstone.Entity.Podcast;
import com.educast.capstone.Repository.PodcastRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class PodcastService {

    private final PodcastRepository podcastRepository;
    private final MlServiceClient mlServiceClient;

    @Value("${podcast.upload.dir:/uploads}")
    private String uploadDir;

    public PodcastService(PodcastRepository podcastRepository, MlServiceClient mlServiceClient) {
        this.podcastRepository = podcastRepository;
        this.mlServiceClient = mlServiceClient;
    }

    public PodcastResponseDto upload(MultipartFile file, String title, int userId) throws IOException {
        String ext = getExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID() + ext;
        Path dir = Paths.get(uploadDir, String.valueOf(userId));
        Files.createDirectories(dir);
        Path savedPath = dir.resolve(filename);
        Files.write(savedPath, file.getBytes());

        Podcast podcast = new Podcast(userId, title, savedPath.toString(), Instant.now());
        podcastRepository.save(podcast);

        try {
            MlServiceResponse ml = mlServiceClient.processAudio(file);
            podcast.setTranscription(ml.transcription());
            podcast.setTags(ml.tags());
            podcast.setIsEducational(ml.isEducational());
            podcast.setValidationReason(ml.validationReason());
            podcast.setLanguage(ml.language());
            podcast.setDurationSec(ml.durationSec());
        } catch (Exception e) {
            podcast.setValidationReason("ML service unavailable: " + e.getMessage());
        }

        podcastRepository.save(podcast);
        return PodcastResponseDto.from(podcast);
    }

    public List<PodcastResponseDto> getByUser(int userId) {
        return podcastRepository.findByUserIdOrderByUploadedAtDesc(userId)
                .stream()
                .map(PodcastResponseDto::from)
                .toList();
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf('.'));
    }
}
