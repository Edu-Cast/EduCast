package com.educast.capstone.Service;

import com.educast.capstone.Entity.User;
import com.educast.capstone.Repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class UserCleanupService {

    private static final Logger logger = LoggerFactory.getLogger(UserCleanupService.class);

    private final UserRepository userRepository;

    @Autowired
    public UserCleanupService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Запускается каждый час
    @Scheduled(fixedRate = 900000)
    public void removeUnconfirmedUsers() {
        Instant cutoff = Instant.now().minus(15, ChronoUnit.MINUTES);
        List<User> expiredUsers = userRepository.findByIsConfirmedFalseAndCreatedAtBefore(cutoff);

        if (!expiredUsers.isEmpty()) {
            userRepository.deleteAll(expiredUsers);
            logger.info("Deleted {} unconfirmed users older than 15 minutes", expiredUsers.size());
        }
    }
}