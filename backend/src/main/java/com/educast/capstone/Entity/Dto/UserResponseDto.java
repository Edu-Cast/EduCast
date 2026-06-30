package com.educast.capstone.Entity.Dto;

public class UserResponseDto {
    private String email;
    private String login;
    private boolean isVerified;

    public UserResponseDto(String email, String login, boolean isVerified) {
        this.email = email;
        this.login = login;
        this.isVerified = isVerified;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getLogin() {
        return login;
    }

    public void setLogin(String login) {
        this.login = login;
    }

    public boolean isVerified() {
        return isVerified;
    }

    public void setVerified(boolean verified) {
        isVerified = verified;
    }
}
