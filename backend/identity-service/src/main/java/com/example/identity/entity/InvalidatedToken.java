package com.example.identity.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

import java.util.Date;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "invalidated_token")
public class InvalidatedToken {

    @Id
    @Column(name = "id", nullable = false)
    private String id;

    @Column(name = "expiry_time")
    private Date expiryTime;
}