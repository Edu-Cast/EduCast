package com.educast.capstone.Controller.common;

import com.educast.capstone.Entity.Dto.*;
import com.educast.capstone.Service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class PublicAuthorizationController {
    private final UserService userService;

    @Autowired
    public PublicAuthorizationController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register/init")
    public UserResponseDto initiateRegisterUser(@Valid @RequestBody UserRegistrationInitRequest request) {
        return userService.initiateRegistration(request);
    }

    @PostMapping("/register/verify")
    public UserResponseDto verifyRegisterUser(@Valid @RequestBody UserRegistrationVerificationRequest request) {
        return userService.verifyRegistration(request);
    }

    @PostMapping("/register/resend")
    public UserResponseDto resendCode(@Valid @RequestBody ResendCodeRequest request) {
        return userService.resendVerificationCode(request);
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return userService.login(request);
    }
}
