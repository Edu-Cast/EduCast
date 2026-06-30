package com.educast.capstone.Entity.Dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CommentRequest {

    @NotBlank(message = "Comment text can't be empty")
    @Size(max = 1000, message = "Comment can't exceed 1000 characters")
    private String text;

    public CommentRequest() { }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
}
