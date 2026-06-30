package com.educast.capstone.Service.Storage;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    String store(MultipartFile file, String subDirectory);
    void delete(String filePath);
}