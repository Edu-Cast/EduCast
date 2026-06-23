package com.educast.capstone.Entity;

import jakarta.persistence.*;

@Entity
@Table(name = "saved_podcasts")
public class SavedPodcast {

    @EmbeddedId
    private SavedPodcastId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("podcastId")
    @JoinColumn(name = "podcast_id")
    private Podcast podcast;

    public SavedPodcast() { }

    public SavedPodcast(User user, Podcast podcast) {
        this.id = new SavedPodcastId(user.getId(), podcast.getId());
        this.user = user;
        this.podcast = podcast;
    }

    public SavedPodcastId getId() { return id; }
    public User getUser() { return user; }
    public Podcast getPodcast() { return podcast; }
}
