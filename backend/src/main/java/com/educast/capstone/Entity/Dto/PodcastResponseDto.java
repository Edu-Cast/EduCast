package com.educast.capstone.Entity.Dto;


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

    public PodcastResponseDto(Long id, String title, String description, String subject,
                              String educationLevel, Integer durationSeconds, Long fileSizeBytes,
                              String authorLogin, String createdAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.subject = subject;
        this.educationLevel = educationLevel;
        this.durationSeconds = durationSeconds;
        this.fileSizeBytes = fileSizeBytes;
        this.authorLogin = authorLogin;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getSubject() {
        return subject;
    }

    public String getEducationLevel() {
        return educationLevel;
    }

    public Integer getDurationSeconds() {
        return durationSeconds;
    }

    public Long getFileSizeBytes() {
        return fileSizeBytes;
    }

    public String getAuthorLogin() {
        return authorLogin;
    }

    public String getCreatedAt() {
        return createdAt;
    }
}