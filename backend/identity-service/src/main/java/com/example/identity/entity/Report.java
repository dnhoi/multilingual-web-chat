package com.example.identity.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "reports")
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reported_user", nullable = false)
    private String reportedUser;

    @Column(name = "reason", nullable = false)
    private String reason;

    @Column(name = "reporter", nullable = false)
    private String reporter;

    @Column(name = "status", nullable = false)
    private String status; // PENDING, RESOLVED

    @Column(name = "timestamp")
    private Instant timestamp;
}
