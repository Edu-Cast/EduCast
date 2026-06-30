package com.educast.capstone.Entity.Dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class UserRegistrationVerificationRequest {
    @NotNull(message = "Verification code can't be empty")
    private Integer verificationCode;

    @NotBlank(message = "Email can't be empty")
    @Email(message = "Incorrect email format")
    private String email;

    public UserRegistrationVerificationRequest(Integer verificationCode, String email) {
        this.verificationCode = verificationCode;
        this.email = email;
    }

    public Integer getVerificationCode() {
        return verificationCode;
    }

    public void setVerificationCode(Integer verificationCode) {
        this.verificationCode = verificationCode;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }


}
