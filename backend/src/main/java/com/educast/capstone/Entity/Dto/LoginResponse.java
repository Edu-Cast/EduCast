package com.educast.capstone.Entity.Dto;

public class LoginResponse {
    private String token;
    private String email;
    private String login;

    public LoginResponse(String token, String email, String login) {
        this.token = token;
        this.email = email;
        this.login = login;
    }

    public String getToken() { return token; }
    public String getEmail() { return email; }
    public String getLogin() { return login; }
}