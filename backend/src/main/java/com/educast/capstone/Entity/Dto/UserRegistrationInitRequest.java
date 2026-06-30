package com.educast.capstone.Entity.Dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class UserRegistrationInitRequest {

    @NotBlank(message = "Login can't be empty")
    @Size(min = 4, max = 30, message = "Login can be from 4 to 30 symbols")
    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Login may contain only letters, digits, and underscore")
    private String login;

    @NotBlank(message = "Email can't be empty")
    @Email(message = "Incorrect email format")
    private String email;

    @NotBlank(message = "Password can't be empty")
    @Size(min = 8, max = 100, message = "Password should contain from 8 to 100 symbols")
    private String password;

    public UserRegistrationInitRequest(String login, String email, String password) {
        this.login = login;
        this.email = email;
        this.password = password;
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
}
