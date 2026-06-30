package com.educast.capstone.Service;

import org.jaudiotagger.audio.AudioFile;
import org.jaudiotagger.audio.AudioFileIO;
import org.jaudiotagger.audio.AudioHeader;
import org.springframework.stereotype.Service;

import java.io.File;

@Service
public class AudioMetadataService {

    public int getDurationSeconds(File audioFile) {
        try {
            AudioFile f = AudioFileIO.read(audioFile);
            AudioHeader header = f.getAudioHeader();
            return header.getTrackLength();
        } catch (Exception e) {
            throw new RuntimeException("Failed to read audio metadata. File may be corrupted or not a valid audio file", e);
        }
    }
}
