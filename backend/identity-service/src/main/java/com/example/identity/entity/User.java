package com.example.identity.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "users")
public class User {

    @Id
    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;

    @Column(name = "username", nullable = false)
    private String username;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "full_name", length = 100)
    private String fullName;

    @Column(name = "created_at", updatable = false, insertable = false)
    private Instant createdAt;

    @Column(name = "updated_at", insertable = false)
    private Instant updatedAt;

    @Column(name = "role", nullable = false)
    private String role;

    @Size(max = 255)
    @NotNull
    @Email(message = "INVALID_EMAIL")
    @Column(name = "email", nullable = false)
    private String email;

    @Size(max = 255)
    @Column(name = "google_id")
    private String googleId;

    @Column(name = "avatar_url", columnDefinition = "LONGTEXT")
    private String avatarUrl;

    @Size(max = 10)
    @Column(name = "locale", length = 10)
    @ColumnDefault("'US'")
    private String locale;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "bio", columnDefinition = "LONGTEXT")
    private String bio;

    @Size(max = 255)
    @Column(name = "website")
    private String website;

    @Size(max = 20)
    @Column(name = "gender", length = 20)
    private String gender;

    @Size(max = 20)
    @Column(name = "birthday", length = 20)
    private String birthday;

    @Size(max = 30)
    @Column(name = "phone", length = 30)
    private String phone;

    @Size(max = 100)
    @Column(name = "country", length = 100)
    private String country;

    @Size(max = 50)
    @Column(name = "timezone", length = 50)
    private String timezone;

    @Column(name = "cover_url", columnDefinition = "LONGTEXT")
    private String coverUrl;

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.isActive == null) {
            this.isActive = false;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}