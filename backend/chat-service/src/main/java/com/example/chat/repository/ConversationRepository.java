package com.example.chat.repository;

import com.example.chat.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, String> {

    Conversation findByConversationId(String conversationId);

    Optional<Conversation> findByInviteCode(String inviteCode);
}
