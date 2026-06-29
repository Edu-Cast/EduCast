package com.educast.capstone.Entity.Dto;

import com.educast.capstone.Entity.Podcast;

import java.time.Instant;
import java.util.List;

public record PodcastResponseDto(
        Long id,
        int userId,
        String title,
        String transcription,
        List<String> tags,
        Boolean isEducational,
        String validationReason,
        String language,
        Double durationSec,
        Instant uploadedAt
) {
    public static PodcastResponseDto from(Podcast p) {
        return new PodcastResponseDto(
                p.getId(),
                p.getUserId(),
                p.getTitle(),
                p.getTranscription(),
                p.getTags(),
                p.getIsEducational(),
                p.getValidationReason(),
                p.getLanguage(),
                p.getDurationSec(),
                p.getUploadedAt()
        );
    }
}
