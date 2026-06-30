package com.educast.capstone.Entity.Dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class VoteRequest {

    @NotNull
    @Min(-1) @Max(1)
    private Integer vote;

    public VoteRequest() { }
    public Integer getVote() { return vote; }
    public void setVote(Integer vote) { this.vote = vote; }
}
