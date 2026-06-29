package com.educast.capstone.Entity;

import com.educast.capstone.Util.StringListConverter;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "podcasts")
public class Podcast {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private int userId;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "audio_path", nullable = false)
    private String audioPath;

    @Column(name = "transcription", columnDefinition = "TEXT")
    private String transcription;

    @Convert(converter = StringListConverter.class)
    @Column(name = "tags", columnDefinition = "TEXT")
    private List<String> tags;

    @Column(name = "is_educational")
    private Boolean isEducational;

    @Column(name = "validation_reason", columnDefinition = "TEXT")
    private String validationReason;

    @Column(name = "language", length = 10)
    private String language;

    @Column(name = "duration_sec")
    private Double durationSec;

    @Column(name = "uploaded_at", nullable = false)
    private Instant uploadedAt;

    public Podcast() {}

    public Podcast(int userId, String title, String audioPath, Instant uploadedAt) {
        this.userId = userId;
        this.title = title;
        this.audioPath = audioPath;
        this.uploadedAt = uploadedAt;
    }

    public Long getId() { return id; }
    public int getUserId() { return userId; }
    public String getTitle() { return title; }
    public String getAudioPath() { return audioPath; }
    public String getTranscription() { return transcription; }
    public List<String> getTags() { return tags; }
    public Boolean getIsEducational() { return isEducational; }
    public String getValidationReason() { return validationReason; }
    public String getLanguage() { return language; }
    public Double getDurationSec() { return durationSec; }
    public Instant getUploadedAt() { return uploadedAt; }

    public void setTranscription(String transcription) { this.transcription = transcription; }
    public void setTags(List<String> tags) { this.tags = tags; }
    public void setIsEducational(Boolean isEducational) { this.isEducational = isEducational; }
    public void setValidationReason(String validationReason) { this.validationReason = validationReason; }
    public void setLanguage(String language) { this.language = language; }
    public void setDurationSec(Double durationSec) { this.durationSec = durationSec; }
}
