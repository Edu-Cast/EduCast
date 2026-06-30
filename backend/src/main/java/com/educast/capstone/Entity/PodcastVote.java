package com.educast.capstone.Entity;

import jakarta.persistence.*;

@Entity
@Table(name = "podcast_votes")
public class PodcastVote {

    @EmbeddedId
    private PodcastVoteId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("podcastId")
    @JoinColumn(name = "podcast_id")
    private Podcast podcast;

    @Column(name = "vote", nullable = false)
    private int vote; // +1 или -1

    public PodcastVote() { }

    public PodcastVote(User user, Podcast podcast, int vote) {
        this.id = new PodcastVoteId(user.getId(), podcast.getId());
        this.user = user;
        this.podcast = podcast;
        this.vote = vote;
    }

    public PodcastVoteId getId() { return id; }
    public User getUser() { return user; }
    public Podcast getPodcast() { return podcast; }
    public int getVote() { return vote; }
    public void setVote(int vote) { this.vote = vote; }
}