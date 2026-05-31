package com.example.chat.repository;

import com.example.chat.entity.GroupMember;
import com.example.chat.entity.GroupMemberId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, GroupMemberId> {

    @Query("""
        SELECT c.conversationId
        FROM Conversation c
        WHERE c.locale IS NULL
          AND EXISTS (
            SELECT 1 FROM GroupMember gm1
            WHERE gm1.id.conversationId = c.conversationId
              AND gm1.id.userId = :userId1
          )
          AND EXISTS (
            SELECT 1 FROM GroupMember gm2
            WHERE gm2.id.conversationId = c.conversationId
              AND gm2.id.userId = :userId2
          )
          AND (
            SELECT COUNT(DISTINCT gm3.id.userId)
            FROM GroupMember gm3
            WHERE gm3.id.conversationId = c.conversationId
          ) = 2
        ORDER BY c.createdAt DESC
        """)
    Optional<String> findConversationIdBetweenTwoUsers(@Param("userId1") String userId1,
                                                       @Param("userId2") String userId2);

    @Query("""
        SELECT gm.id.conversationId
        FROM GroupMember gm
        WHERE gm.id.userId = :userId
          AND gm.id.conversationId = :conversationId
        """)
    Optional<String> findConversationIdByUserIdAndConversationId(@Param("userId") String userId,
                                                                 @Param("conversationId") String conversationId);

    @Query("""
        SELECT gm.id.userId
        FROM GroupMember gm
        WHERE gm.id.conversationId = :conversationId
          AND gm.id.userId != :userId
        """)
    String getGroupMembersByUserId(@Param("userId") String userId,
                                   @Param("conversationId") String conversationId);

    @Query("""
        SELECT gm.id.userId
        FROM GroupMember gm
        WHERE gm.id.conversationId = :conversationId
          AND gm.id.userId != :userId
        """)
    List<String> getGroupMembersByConversationIdExcludeUser(@Param("conversationId") String conversationId,
                                                            @Param("userId") String userId);

    @Query("""
        SELECT gm.id.userId
        FROM GroupMember gm
        WHERE gm.id.conversationId = :conversationId
        """)
    List<String> getGroupMembersByConversationId(@Param("conversationId") String conversationId);

    boolean existsByIdUserIdAndIdConversationId(String userId, String conversationId);

    void deleteByIdConversationId(String conversationId);

    Optional<GroupMember> findByIdUserIdAndIdConversationId(String userId, String conversationId);

    List<GroupMember> findByIdConversationId(String conversationId);

    List<GroupMember> findByIdConversationIdIn(Collection<String> conversationIds);
}
