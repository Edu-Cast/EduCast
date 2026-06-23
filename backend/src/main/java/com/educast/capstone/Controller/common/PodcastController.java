package com.educast.capstone.Controller.common;

import com.educast.capstone.Entity.Dto.PodcastResponseDto;
import com.educast.capstone.Entity.EducationLevel;
import com.educast.capstone.Entity.Subject;
import com.educast.capstone.Entity.User;
import com.educast.capstone.Service.PodcastService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/podcasts")
public class PodcastController {

    private final PodcastService podcastService;

    @Autowired
    public PodcastController(PodcastService podcastService) {
        this.podcastService = podcastService;
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

    private User getCurrentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}