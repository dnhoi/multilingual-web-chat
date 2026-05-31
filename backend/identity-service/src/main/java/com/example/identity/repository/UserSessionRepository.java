package com.example.identity.repository;

import com.example.identity.entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, String> {

    List<UserSession> findByUserIdOrderByLastActiveDesc(String userId);

    Optional<UserSession> findByRefreshToken(String refreshToken);

    Optional<UserSession> findBySessionIdAndUserId(String sessionId, String userId);

    void deleteByUserId(String userId);

    void deleteByUserIdAndSessionIdNot(String userId, String sessionId);
}
