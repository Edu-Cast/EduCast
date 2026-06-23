package com.educast.capstone.Service;

import com.educast.capstone.Entity.Dto.*;
import com.educast.capstone.Entity.User;
import com.educast.capstone.Repository.UserRepository;
import com.educast.capstone.Util.PasswordValidator;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@Transactional
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordValidator passwordValidator;
    private final EmailService emailService;
    private final JwtService jwtService;

    @Autowired
    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       PasswordValidator passwordValidator,
                       EmailService emailService,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordValidator = passwordValidator;
        this.emailService = emailService;
        this.jwtService = jwtService;
    }

    public UserResponseDto initiateRegistration(UserRegistrationInitRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already in use");
        }
        if (userRepository.existsByLogin(request.getLogin())) {
            throw new IllegalArgumentException("Login is already in use");
        }

        passwordValidator.validate(request.getPassword());
        String encodedPassword = passwordEncoder.encode(request.getPassword());
        User unverifyedUser = new User(request.getLogin(), request.getEmail(), encodedPassword);
        userRepository.save(unverifyedUser);

        emailService.sendVerificationCode(unverifyedUser.getEmail(), unverifyedUser.getVerificationCode());

        return new UserResponseDto(request.getEmail(), request.getLogin(), false);
    }

    public UserResponseDto verifyRegistration(UserRegistrationVerificationRequest request) {
        User userToVerify = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (userToVerify.getVerificationCodeExpiresAt().isAfter(Instant.now())) {
            if (userToVerify.getVerificationCode().equals(request.getVerificationCode())) {
                userToVerify.setConfirmed(true);
                userRepository.save(userToVerify);
                return new UserResponseDto(request.getEmail(), userToVerify.getLogin(), userToVerify.isConfirmed());
            } else {
                throw new IllegalArgumentException("Wrong code");
            }
        } else {
            throw new RuntimeException("Verification code is expired, register again");
        }
    }

    public UserResponseDto resendVerificationCode(ResendCodeRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.isConfirmed()) {
            throw new IllegalArgumentException("Email is already verified");
        }
        Instant cooldownEnd = user.getLastCodeSentAt().plusSeconds(30);
        if (cooldownEnd.isAfter(Instant.now())) {
            long secondsLeft = Instant.now().until(cooldownEnd, ChronoUnit.SECONDS);
            throw new IllegalArgumentException("Подождите " + secondsLeft + " секунд перед повторной отправкой кода");
        }

        user.regenerateVerificationCode();
        userRepository.save(user);
        emailService.sendVerificationCode(user.getEmail(), user.getVerificationCode());

        return new UserResponseDto(user.getEmail(), user.getLogin(), user.isConfirmed());
    }


    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!user.isConfirmed()) {
            throw new IllegalArgumentException("Email is not verified");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        String token = jwtService.generateToken(user.getEmail(), user.getId());
        return new LoginResponse(token, user.getEmail(), user.getLogin());
    }

}
