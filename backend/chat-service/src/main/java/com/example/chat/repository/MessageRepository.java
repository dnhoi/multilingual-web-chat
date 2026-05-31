package com.example.chat.repository;

import com.example.chat.entity.Conversation;
import com.example.chat.entity.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findAllByConversationOrderBySentDatetimeDesc(Conversation conversation, Pageable pageable);

    Optional<Message> findFirstByConversationAndUserIdOrderBySentDatetimeDesc(Conversation conversation, String userId);

    void deleteByConversation(Conversation conversation);

    List<Message> findByConversationAndMessageTextContainingIgnoreCaseOrderBySentDatetimeDesc(Conversation conversation, String keyword, Pageable pageable);

    @Query(value = """
        SELECT m1.*
        FROM message m1
        JOIN (
            SELECT m.conversation_id, MAX(m.sent_datetime) AS last_sent
            FROM message m
            JOIN group_member gm ON m.conversation_id = gm.conversation_id
            WHERE gm.user_id = :userId
              AND (gm.left_datetime IS NULL OR m.sent_datetime <= gm.left_datetime)
            GROUP BY m.conversation_id
        ) last_msg 
        ON m1.conversation_id = last_msg.conversation_id 
        AND m1.sent_datetime = last_msg.last_sent
        ORDER BY last_msg.last_sent DESC, m1.message_id DESC
        """, nativeQuery = true)
    List<Message> findLastMessagesByUserId(@Param("userId") String userId, Pageable pageable);
}
