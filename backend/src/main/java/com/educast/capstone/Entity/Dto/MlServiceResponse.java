package com.educast.capstone.Entity.Dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record MlServiceResponse(
        String transcription,
        List<String> tags,
        @JsonProperty("is_educational") boolean isEducational,
        @JsonProperty("validation_reason") String validationReason,
        String language,
        @JsonProperty("duration_sec") double durationSec
) {}
