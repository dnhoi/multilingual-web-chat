-- =========================================================
-- MULTILINGUAL WEB CHAT - DATABASE INITIALIZATION SCRIPT
-- =========================================================

CREATE DATABASE IF NOT EXISTS `identify_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `chat_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =========================================================
-- 1. IDENTIFY_DB SCHEMA & SEED DATA
-- =========================================================
USE `identify_db`;

CREATE TABLE IF NOT EXISTS `users` (
    `user_id` VARCHAR(50) NOT NULL PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `full_name` VARCHAR(100) NOT NULL,
    `avatar_url` VARCHAR(500) NULL,
    `cover_photo_url` VARCHAR(500) NULL,
    `role` VARCHAR(20) NOT NULL DEFAULT 'ROLE_USER',
    `locale` VARCHAR(10) NOT NULL DEFAULT 'VI',
    `is_active` TINYINT(1) NOT NULL DEFAULT 0,
    `bio` TEXT NULL,
    `website` VARCHAR(255) NULL,
    `gender` VARCHAR(10) NULL,
    `birthday` DATE NULL,
    `google_id` VARCHAR(100) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX `idx_users_username` (`username`),
    INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_sessions` (
    `session_id` VARCHAR(50) NOT NULL PRIMARY KEY,
    `user_id` VARCHAR(50) NOT NULL,
    `ip_address` VARCHAR(50) NULL,
    `user_agent` TEXT NULL,
    `expires_at` DATETIME(6) NOT NULL,
    `is_revoked` TINYINT(1) NOT NULL DEFAULT 0,
    INDEX `idx_sessions_user_id` (`user_id`),
    CONSTRAINT `fk_session_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reports` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `reporter_id` VARCHAR(50) NOT NULL,
    `reported_user_id` VARCHAR(50) NULL,
    `message_id` BIGINT NULL,
    `reason` TEXT NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `timestamp` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX `idx_reports_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `action` VARCHAR(50) NOT NULL,
    `target` VARCHAR(100) NULL,
    `admin` VARCHAR(50) NOT NULL,
    `timestamp` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX `idx_audit_logs_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `system_config` (
    `config_key` VARCHAR(50) NOT NULL PRIMARY KEY,
    `config_value` TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `invalidated_token` (
    `id` VARCHAR(255) NOT NULL PRIMARY KEY,
    `expiry_time` DATETIME(6) NOT NULL,
    INDEX `idx_inv_token_expiry` (`expiry_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chèn tài khoản Admin mặc định (mật khẩu: Admin@1234)
INSERT INTO `users` (
    `user_id`, `username`, `password`, `full_name`, `email`, 
    `role`, `locale`, `is_active`, `created_at`, `updated_at`
) VALUES (
    'admin',
    'admin',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    'Administrator',
    'admin@localhost.com',
    'ROLE_ADMIN',
    'VI',
    1,
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE `user_id` = `user_id`;

-- =========================================================
-- 2. CHAT_DB SCHEMA
-- =========================================================
USE `chat_db`;

CREATE TABLE IF NOT EXISTS `conversation` (
    `conversation_id` VARCHAR(50) NOT NULL PRIMARY KEY,
    `conversation_name` VARCHAR(100) NULL,
    `locale` VARCHAR(20) NULL,
    `avatar_url` TEXT NULL,
    `description` TEXT NULL,
    `type` VARCHAR(20) NOT NULL DEFAULT 'DIRECT',
    `is_archived` TINYINT(1) NOT NULL DEFAULT 0,
    `is_pinned` TINYINT(1) NOT NULL DEFAULT 0,
    `is_favorite` TINYINT(1) NOT NULL DEFAULT 0,
    `is_muted` TINYINT(1) NOT NULL DEFAULT 0,
    `invite_code` VARCHAR(50) NULL,
    `announcement` TEXT NULL,
    `slow_mode_seconds` INT NOT NULL DEFAULT 0,
    `subscriber_count` BIGINT NOT NULL DEFAULT 0,
    `is_public_channel` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX `idx_conversation_invite_code` (`invite_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `group_member` (
    `user_id` VARCHAR(50) NOT NULL,
    `conversation_id` VARCHAR(50) NOT NULL,
    `role` VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    `is_muted` TINYINT(1) NOT NULL DEFAULT 0,
    `is_banned` TINYINT(1) NOT NULL DEFAULT 0,
    `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    `joined_datetime` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `left_datetime` DATETIME(6) NULL,
    PRIMARY KEY (`user_id`, `conversation_id`),
    INDEX `idx_group_member_conv` (`conversation_id`),
    CONSTRAINT `fk_group_member_conv` FOREIGN KEY (`conversation_id`) REFERENCES `conversation` (`conversation_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `message` (
    `message_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `conversation_id` VARCHAR(50) NOT NULL,
    `user_id` VARCHAR(50) NOT NULL,
    `message_text` MEDIUMTEXT NOT NULL,
    `message_text_translate` MEDIUMTEXT NULL,
    `type` VARCHAR(20) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'SENT',
    `sent_datetime` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `reply_to_message_id` BIGINT NULL,
    `reply_to_message_text` TEXT NULL,
    `reply_to_user_id` VARCHAR(50) NULL,
    `forward_from_message_id` BIGINT NULL,
    `forward_from_user_id` VARCHAR(50) NULL,
    `is_edited` TINYINT(1) NOT NULL DEFAULT 0,
    `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
    `is_pinned` TINYINT(1) NOT NULL DEFAULT 0,
    `reactions` TEXT NULL,
    `poll_data` TEXT NULL,
    `location_data` VARCHAR(255) NULL,
    INDEX `idx_message_conv_sent` (`conversation_id`, `sent_datetime` DESC),
    INDEX `idx_message_user_id` (`user_id`),
    CONSTRAINT `fk_message_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `conversation` (`conversation_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
