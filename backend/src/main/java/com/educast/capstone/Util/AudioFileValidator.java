package com.educast.capstone.Util;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

@Component
public class AudioFileValidator {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "audio/mpeg",
            "audio/mp3",
            "audio/ogg",
            "audio/wav",
            "audio/x-wav",
            "audio/x-m4a",
            "audio/mp4",
            "audio/aac"
    );

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            ".mp3", ".ogg", ".wav", ".m4a", ".aac"
    );

    public void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Invalid file type. Allowed formats: mp3, ogg, wav, m4a, aac");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || ALLOWED_EXTENSIONS.stream().noneMatch(ext -> filename.toLowerCase().endsWith(ext))) {
            throw new IllegalArgumentException("Invalid file extension. Allowed formats: mp3, ogg, wav, m4a, aac");
        }
    }
}
