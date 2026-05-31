package com.example.identity.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "system_configs")
public class SystemConfig {

    @Id
    @Column(name = "config_key", nullable = false, length = 100)
    private String key;

    @Column(name = "config_value", nullable = false)
    private String value;

    @Column(name = "description")
    private String description;
}
