package com.educast.capstone.Controller.common;

import com.educast.capstone.Entity.Dto.CommentRequest;
import com.educast.capstone.Entity.Dto.CommentResponseDto;
import com.educast.capstone.Entity.Dto.PodcastResponseDto;
import com.educast.capstone.Entity.Dto.VoteRequest;
import com.educast.capstone.Entity.User;
import com.educast.capstone.Service.CommentService;
import com.educast.capstone.Service.SavedPodcastService;
import com.educast.capstone.Service.VoteService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/podcasts")
public class InteractionController {

    private final VoteService voteService;
    private final SavedPodcastService savedPodcastService;
    private final CommentService commentService;

    @Autowired
    public InteractionController(VoteService voteService,
                                 SavedPodcastService savedPodcastService,
                                 CommentService commentService) {
        this.voteService = voteService;
        this.savedPodcastService = savedPodcastService;
        this.commentService = commentService;
    }

    // ===== Upvotes =====

    @PostMapping("/{id}/vote")
    public Map<String, Integer> vote(@PathVariable Long id,
                                     @Valid @RequestBody VoteRequest request) {
        User currentUser = getCurrentUser();
        int newScore = voteService.vote(id, request.getVote(), currentUser);
        return Map.of("score", newScore);
    }

    // ===== Saves =====

    @PostMapping("/{id}/save")
    public Map<String, String> toggleSave(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        String message = savedPodcastService.toggleSave(id, currentUser);
        return Map.of("message", message);
    }

    @GetMapping("/saved")
    public List<PodcastResponseDto> getSaved() {
        User currentUser = getCurrentUser();
        return savedPodcastService.getSavedPodcasts(currentUser);
    }

    // ===== Comments =====

    @PostMapping("/{id}/comments")
    public CommentResponseDto addComment(@PathVariable Long id,
                                         @Valid @RequestBody CommentRequest request) {
        User currentUser = getCurrentUser();
        return commentService.addComment(id, request.getText(), currentUser);
    }

    @GetMapping("/{id}/comments")
    public List<CommentResponseDto> getComments(@PathVariable Long id) {
        return commentService.getComments(id);
    }

    @DeleteMapping("/comments/{commentId}")
    public void deleteComment(@PathVariable Long commentId) {
        User currentUser = getCurrentUser();
        commentService.deleteComment(commentId, currentUser);
    }

    private User getCurrentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
