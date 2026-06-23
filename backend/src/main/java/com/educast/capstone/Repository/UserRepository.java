package com.educast.capstone.Repository;

import com.educast.capstone.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByLogin(String login);

    List<User> findByIsConfirmedFalseAndCreatedAtBefore(Instant cutoff);
}
