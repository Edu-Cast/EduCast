package com.educast.capstone.Entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "comments")
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "text", nullable = false, length = 1000)
    private String text;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "podcast_id", nullable = false)
    private Podcast podcast;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public Comment() { }

    public Comment(String text, User author, Podcast podcast) {
        this.text = text;
        this.author = author;
        this.podcast = podcast;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public User getAuthor() { return author; }
    public Podcast getPodcast() { return podcast; }
    public Instant getCreatedAt() { return createdAt; }
}