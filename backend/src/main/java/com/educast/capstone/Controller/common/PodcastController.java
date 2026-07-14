package com.educast.capstone.Controller.common;

import com.educast.capstone.Entity.Dto.PodcastDetailDto;
import com.educast.capstone.Entity.Dto.PodcastResponseDto;
import com.educast.capstone.Entity.EducationLevel;
import com.educast.capstone.Entity.Subject;
import com.educast.capstone.Entity.User;
import com.educast.capstone.Service.PodcastService;
import com.educast.capstone.Service.SearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/api/podcasts")
public class PodcastController {

    private final PodcastService podcastService;
    private final SearchService searchService;

    @Autowired
    public PodcastController(PodcastService podcastService, SearchService searchService) {
        this.podcastService = podcastService;
        this.searchService = searchService;
    }

    @PostMapping(consumes = "multipart/form-data")
    public PodcastResponseDto upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("subject") Subject subject,
            @RequestParam("educationLevel") EducationLevel educationLevel) {

        User currentUser = getCurrentUser();
        return podcastService.upload(file, title, description, subject, educationLevel, currentUser);
    }

    @GetMapping
    public List<PodcastResponseDto> getAll() {
        return podcastService.getAll();
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        podcastService.delete(id, currentUser);
    }

    @GetMapping("/search")
    public List<PodcastResponseDto> search(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) String educationLevel) {
        return searchService.search(query, subject, educationLevel);
    }

    @GetMapping("/{id}")
    public PodcastDetailDto getById(@PathVariable Long id) {
        return podcastService.getById(id);
    }

    @GetMapping("/{id}/audio")
    public ResponseEntity<byte[]> getAudio(
            @PathVariable Long id,
            @RequestHeader(value = HttpHeaders.RANGE, required = false) String rangeHeader) {
        String contentType = podcastService.getContentType(id);
        Path audioPath = podcastService.getAudioPath(id);

        try {
            long fileSize = Files.size(audioPath);

            if (rangeHeader == null || !rangeHeader.startsWith("bytes=")) {
                byte[] audioData = Files.readAllBytes(audioPath);
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_TYPE, contentType)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                        .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                        .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(fileSize))
                        .body(audioData);
            }

            long[] range = parseRange(rangeHeader, fileSize);
            long start = range[0];
            long end = range[1];
            int chunkSize = Math.toIntExact(end - start + 1);
            byte[] chunk = new byte[chunkSize];

            try (RandomAccessFile file = new RandomAccessFile(audioPath.toFile(), "r")) {
                file.seek(start);
                file.readFully(chunk);
            }

            return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(chunkSize))
                    .header(HttpHeaders.CONTENT_RANGE, "bytes " + start + "-" + end + "/" + fileSize)
                    .body(chunk);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read audio file", e);
        }
    }

    private long[] parseRange(String rangeHeader, long fileSize) {
        String range = rangeHeader.substring("bytes=".length()).split(",", 2)[0].trim();
        String[] parts = range.split("-", 2);

        long start;
        long end;

        if (parts[0].isBlank()) {
            long suffixLength = Long.parseLong(parts[1]);
            start = Math.max(0, fileSize - suffixLength);
            end = fileSize - 1;
        } else {
            start = Long.parseLong(parts[0]);
            end = parts.length > 1 && !parts[1].isBlank()
                    ? Long.parseLong(parts[1])
                    : fileSize - 1;
        }

        start = Math.max(0, Math.min(start, fileSize - 1));
        end = Math.max(start, Math.min(end, fileSize - 1));
        return new long[]{start, end};
    }

    @GetMapping("/popular")
    public List<PodcastResponseDto> getPopular() {
        return podcastService.getPopular();
    }

    @GetMapping("/popular/{subject}")
    public List<PodcastResponseDto> getPopularBySubject(@PathVariable Subject subject) {
        return podcastService.getPopularBySubject(subject);
    }

    @GetMapping("/my")
    public List<PodcastResponseDto> getMyPodcasts() {
        User currentUser = getCurrentUser();
        return podcastService.getMyPodcasts(currentUser);
    }


    private User getCurrentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
