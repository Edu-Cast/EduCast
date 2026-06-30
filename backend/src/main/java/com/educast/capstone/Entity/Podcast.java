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
    @Column(name = "id")
    private Long id;

    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Column(name = "original_file_name")
    private String originalFileName;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @Enumerated(EnumType.STRING)
    @Column(name = "subject", nullable = false, length = 30)
    private Subject subject;

    @Enumerated(EnumType.STRING)
    @Column(name = "education_level", nullable = false, length = 20)
    private EducationLevel educationLevel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "score", nullable = false)
    private int score = 0;

    // ── ML-поля (заполняются после обработки в ml-service) ──

    @Column(name = "transcription", columnDefinition = "TEXT")
    private String transcription;

    @Convert(converter = StringListConverter.class)
    @Column(name = "tags", columnDefinition = "TEXT")
    private List<String> tags;

    @Column(name = "is_educational")
    private Boolean isEducational;

    @Column(name = "validation_reason", columnDefinition = "TEXT")
    private String validationReason;

    @Column(name = "ml_language", length = 10)
    private String mlLanguage;

    public Podcast() { }

    public Podcast(String title, String description, String filePath,
                   String originalFileName, Subject subject,
                   EducationLevel educationLevel, User author) {
        this.title = title;
        this.description = description;
        this.filePath = filePath;
        this.originalFileName = originalFileName;
        this.subject = subject;
        this.educationLevel = educationLevel;
        this.author = author;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }

    public String getOriginalFileName() { return originalFileName; }
    public void setOriginalFileName(String originalFileName) { this.originalFileName = originalFileName; }

    public Integer getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(Integer durationSeconds) { this.durationSeconds = durationSeconds; }

    public Long getFileSizeBytes() { return fileSizeBytes; }
    public void setFileSizeBytes(Long fileSizeBytes) { this.fileSizeBytes = fileSizeBytes; }

    public Subject getSubject() { return subject; }
    public void setSubject(Subject subject) { this.subject = subject; }

    public EducationLevel getEducationLevel() { return educationLevel; }
    public void setEducationLevel(EducationLevel educationLevel) { this.educationLevel = educationLevel; }

    public User getAuthor() { return author; }

    public Instant getCreatedAt() { return createdAt; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

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
