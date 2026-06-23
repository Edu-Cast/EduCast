package com.educast.capstone.Service;

import com.educast.capstone.Entity.Comment;
import com.educast.capstone.Entity.Dto.CommentResponseDto;
import com.educast.capstone.Entity.Podcast;
import com.educast.capstone.Entity.User;
import com.educast.capstone.Repository.CommentRepository;
import com.educast.capstone.Repository.PodcastRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Transactional
public class CommentService {

    private final CommentRepository commentRepository;
    private final PodcastRepository podcastRepository;

    @Autowired
    public CommentService(CommentRepository commentRepository, PodcastRepository podcastRepository) {
        this.commentRepository = commentRepository;
        this.podcastRepository = podcastRepository;
    }

    public CommentResponseDto addComment(Long podcastId, String text, User currentUser) {
        Podcast podcast = podcastRepository.findById(podcastId)
                .orElseThrow(() -> new IllegalArgumentException("Podcast not found"));

        Comment comment = new Comment(text, currentUser, podcast);
        Comment saved = commentRepository.save(comment);
        return toDto(saved);
    }

    public List<CommentResponseDto> getComments(Long podcastId) {
        Podcast podcast = podcastRepository.findById(podcastId)
                .orElseThrow(() -> new IllegalArgumentException("Podcast not found"));

        return commentRepository.findByPodcastOrderByCreatedAtDesc(podcast)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public void deleteComment(Long commentId, User currentUser) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        boolean isAuthor = comment.getAuthor().getId() == currentUser.getId();
        boolean isPodcastOwner = comment.getPodcast().getAuthor().getId() == currentUser.getId();

        if (!isAuthor && !isPodcastOwner) {
            throw new IllegalArgumentException("You don't have permission to delete this comment");
        }

        commentRepository.delete(comment);
    }

    private CommentResponseDto toDto(Comment comment) {
        return new CommentResponseDto(
                comment.getId(),
                comment.getText(),
                comment.getAuthor().getLogin(),
                comment.getCreatedAt().toString()
        );
    }
}
