package com.educast.capstone.Service.Storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class LocalFileStorageService implements FileStorageService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    public String store(MultipartFile file, String subDirectory) {
        try {
            String extension = getExtension(file.getOriginalFilename());
            String fileName = UUID.randomUUID() + extension;

            Path dirPath = Paths.get(uploadDir, subDirectory);
            Files.createDirectories(dirPath);

            Path targetPath = dirPath.resolve(fileName);
            Files.copy(file.getInputStream(), targetPath);

            return subDirectory + "/" + fileName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }

    @Override
    public void delete(String filePath) {
        try {
            Path path = Paths.get(uploadDir, filePath);
            Files.deleteIfExists(path);
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete file", e);
        }
    }

    public String getFullPath(String filePath) {
        return Paths.get(uploadDir, filePath).toString();
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf("."));
    }
}