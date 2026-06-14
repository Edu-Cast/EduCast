package com.educast.capstone.Entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Random;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private int id;

    @Column(name = "login", unique = true, nullable = false, length = 30)
    private String login;

    @Column(name = "email", unique = true, nullable = false, length = 100)
    private String email;

    @Column(name = "password", nullable = false, length = 60)
    private String password;

    @Column(name = "is_confirmed", nullable = false)
    private boolean isConfirmed;

    @Column(name = "createdAt", nullable = false)
    private Instant createdAt;

    @Column(name = "verification_code", nullable = false)
    private Integer verificationCode;

    @Column(name = "verificationCodeExpiresAt", nullable = false)
    private Instant verificationCodeExpiresAt;

    @Column(name = "last_code_sent_at")
    private Instant lastCodeSentAt;


    public User() { }

    public User(String login, String email, String password) {
        this.login = login;
        this.email = email;
        this.password = password;
        this.isConfirmed = false;
        this.createdAt = Instant.now();
        this.verificationCode = generateVerificationCode();
        this.verificationCodeExpiresAt = Instant.now().plus(15, ChronoUnit.MINUTES);
        this.lastCodeSentAt = Instant.now();
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getLogin() {
        return login;
    }

    public void setLogin(String login) {
        this.login = login;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public boolean isConfirmed() {
        return isConfirmed;
    }

    public void setConfirmed(boolean confirmed) {
        isConfirmed = confirmed;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Integer getVerificationCode() {
        return verificationCode;
    }

    public Instant getVerificationCodeExpiresAt() {
        return verificationCodeExpiresAt;
    }

    public Instant getLastCodeSentAt() {
        return lastCodeSentAt;
    }

    public void setLastCodeSentAt(Instant lastCodeSentAt) {
        this.lastCodeSentAt = lastCodeSentAt;
    }

    public void regenerateVerificationCode() {
        this.verificationCode = generateVerificationCode();
        this.verificationCodeExpiresAt = Instant.now().plus(15, ChronoUnit.MINUTES);
        this.lastCodeSentAt = Instant.now();
    }

    private static Integer generateVerificationCode() {
        return 100000 + new Random().nextInt(900000);
    }
}
