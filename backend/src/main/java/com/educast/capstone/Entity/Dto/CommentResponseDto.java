package com.educast.capstone.Entity.Dto;

public class CommentResponseDto {
    private Long id;
    private String text;
    private String authorLogin;
    private String createdAt;

    public CommentResponseDto(Long id, String text, String authorLogin, String createdAt) {
        this.id = id;
        this.text = text;
        this.authorLogin = authorLogin;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public String getText() { return text; }
    public String getAuthorLogin() { return authorLogin; }
    public String getCreatedAt() { return createdAt; }
}
