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
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
    public ResponseEntity<byte[]> getAudio(@PathVariable Long id) {
        byte[] audioData = podcastService.getAudioFile(id);
        String contentType = podcastService.getContentType(id);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, contentType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .body(audioData);
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