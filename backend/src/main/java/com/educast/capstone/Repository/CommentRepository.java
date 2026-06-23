package com.educast.capstone.Repository;

import com.educast.capstone.Entity.Comment;
import com.educast.capstone.Entity.Podcast;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByPodcastOrderByCreatedAtDesc(Podcast podcast);
}
