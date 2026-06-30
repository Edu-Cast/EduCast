package com.educast.capstone.Entity.Dto;

import java.util.List;

public class PodcastResponseDto {
    private Long id;
    private String title;
    private String description;
    private String subject;
    private String educationLevel;
    private Integer durationSeconds;
    private Long fileSizeBytes;
    private String authorLogin;
    private String createdAt;
    private int score;

    // ML-поля
    private String transcription;
    private List<String> tags;
    private Boolean isEducational;
    private String validationReason;
    private String mlLanguage;

    public PodcastResponseDto(Long id, String title, String description, String subject,
                              String educationLevel, Integer durationSeconds, Long fileSizeBytes,
                              String authorLogin, String createdAt, int score) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.subject = subject;
        this.educationLevel = educationLevel;
        this.durationSeconds = durationSeconds;
        this.fileSizeBytes = fileSizeBytes;
        this.authorLogin = authorLogin;
        this.createdAt = createdAt;
        this.score = score;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getSubject() { return subject; }
    public String getEducationLevel() { return educationLevel; }
    public Integer getDurationSeconds() { return durationSeconds; }
    public Long getFileSizeBytes() { return fileSizeBytes; }
    public String getAuthorLogin() { return authorLogin; }
    public String getCreatedAt() { return createdAt; }
    public int getScore() { return score; }

    public String getTranscription() { return transcription; }
    public void setTranscription(String transcription) { this.transcription = transcription; }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }

    public Boolean getIsEducational() { return isEducational; }
    public void setIsEducational(Boolean isEducational) { this.isEducational = isEducational; }

    public String getValidationReason() { return validationReason; }
    public void setValidationReason(String validationReason) { this.validationReason = validationReason; }

    public String getMlLanguage() { return mlLanguage; }
    public void setMlLanguage(String mlLanguage) { this.mlLanguage = mlLanguage; }
}
