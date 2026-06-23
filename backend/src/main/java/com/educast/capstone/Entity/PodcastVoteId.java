package com.educast.capstone.Entity;

import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class PodcastVoteId implements Serializable {

    private int userId;
    private Long podcastId;

    public PodcastVoteId() { }

    public PodcastVoteId(int userId, Long podcastId) {
        this.userId = userId;
        this.podcastId = podcastId;
    }

    public int getUserId() { return userId; }
    public Long getPodcastId() { return podcastId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof PodcastVoteId that)) return false;
        return userId == that.userId && Objects.equals(podcastId, that.podcastId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, podcastId);
    }
}
