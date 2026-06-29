package com.educast.capstone.Controller;

import com.educast.capstone.Entity.Dto.PodcastResponseDto;
import com.educast.capstone.Entity.User;
import com.educast.capstone.Service.PodcastService;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/podcasts")
public class PodcastController {

    private final PodcastService podcastService;

    public PodcastController(PodcastService podcastService) {
        this.podcastService = podcastService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PodcastResponseDto upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @AuthenticationPrincipal User user
    ) throws IOException {
        return podcastService.upload(file, title, user.getId());
    }

    @GetMapping
    public List<PodcastResponseDto> getMyPodcasts(@AuthenticationPrincipal User user) {
        return podcastService.getByUser(user.getId());
    }
}
