package com.example.chat.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.function.Function;

@Service
@Slf4j
public class IdGeneratorService {

    public String generateRandomId(String prefix, Function<String, Boolean> existsByIdFunc) {
        String id;
        do {
            id = prefix + UUID.randomUUID().toString().replace("-", "").substring(0, 5).toUpperCase();
        } while (existsByIdFunc.apply(id));
        return id;
    }
}