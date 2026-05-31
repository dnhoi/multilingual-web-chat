package com.example.identity.config;

import com.example.identity.entity.User;
import com.example.identity.entity.SystemConfig;
import com.example.identity.repository.UserRepository;
import com.example.identity.repository.SystemConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Cấu hình khởi tạo dữ liệu ban đầu khi dịch vụ Identity khởi động:
 * - Nâng cấp độ dài các cột dữ liệu người dùng (avatar_url, cover_url, bio).
 * - Tạo hoặc cập nhật tài khoản quản trị viên (Admin) mặc định.
 * - Khởi tạo các tham số cấu hình hệ thống mặc định (chế độ bảo trì, số thành viên nhóm tối thiểu, giới hạn tốc độ AI).
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class ApplicationInitConfig {
    private final PasswordEncoder passwordEncoder;
    private final SystemConfigRepository systemConfigRepository;
    private final JdbcTemplate jdbcTemplate;

    @NonFinal
    @Value("${app.admin.username:admin}")
    private String ADMIN_USERNAME;

    @NonFinal
    @Value("${app.admin.password}")
    private String ADMIN_PASSWORD;

    /**
     * Runner thực thi các tác vụ thiết lập ban đầu sau khi Spring ApplicationContext sẵn sàng.
     */
    @Bean
    ApplicationRunner init(UserRepository userRepository) {
        log.info("Bắt đầu khởi tạo dữ liệu ban đầu cho ứng dụng...");
        return args -> {
            try {
                jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN avatar_url LONGTEXT");
                log.info("Đã cập nhật kiểu dữ liệu cột avatar_url thành LONGTEXT");
            } catch (Exception e) {
                log.warn("Không thể cập nhật cột avatar_url (có thể đã là LONGTEXT): {}", e.getMessage());
            }
            try {
                jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN cover_url LONGTEXT");
                log.info("Đã cập nhật kiểu dữ liệu cột cover_url thành LONGTEXT");
            } catch (Exception e) {
                log.warn("Không thể cập nhật cột cover_url: {}", e.getMessage());
            }
            try {
                jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN bio LONGTEXT");
                log.info("Đã cập nhật kiểu dữ liệu cột bio thành LONGTEXT");
            } catch (Exception e) {
                log.warn("Không thể cập nhật cột bio: {}", e.getMessage());
            }

            User adminUser = userRepository.findByUsername(ADMIN_USERNAME).orElse(null);
            if (adminUser == null) {
                adminUser = User.builder()
                        .userId("admin")
                        .username(ADMIN_USERNAME)
                        .password(passwordEncoder.encode(ADMIN_PASSWORD))
                        .email("admin@localhost.com")
                        .role("ADMIN")
                        .isActive(true)
                        .build();
                userRepository.save(adminUser);
                log.info("Tạo tài khoản quản trị viên (Admin) mặc định thành công");
            } else {
                adminUser.setPassword(passwordEncoder.encode(ADMIN_PASSWORD));
                adminUser.setRole("ADMIN");
                adminUser.setIsActive(true);
                userRepository.save(adminUser);
                log.info("Cập nhật mật khẩu và vai trò của tài khoản Admin thành công");
            }
            if (systemConfigRepository.findById("maintenance_mode").isEmpty()) {
                systemConfigRepository.save(SystemConfig.builder()
                        .key("maintenance_mode").value("OFF")
                        .description("Tạm thời vô hiệu hóa kết nối chat phục vụ bảo trì nâng cấp hệ thống")
                        .build());
            }
            if (systemConfigRepository.findById("min_group_members").isEmpty()) {
                systemConfigRepository.save(SystemConfig.builder()
                        .key("min_group_members").value("3")
                        .description("Số lượng thành viên tối thiểu yêu cầu khi tạo nhóm chat")
                        .build());
            }
            if (systemConfigRepository.findById("ai_rate_limit").isEmpty()) {
                systemConfigRepository.save(SystemConfig.builder()
                        .key("ai_rate_limit").value("60 Requests/min")
                        .description("Giới hạn số lượt gọi dịch thuật AI tối đa mỗi người dùng trong một phút")
                        .build());
            }
            if (systemConfigRepository.findById("broadcast_announcement").isEmpty()) {
                systemConfigRepository.save(SystemConfig.builder()
                        .key("broadcast_announcement")
                        .value("{\"enabled\":true,\"message\":\"Chào mừng bạn đến với Hệ thống Nhắn tin Đa ngôn ngữ Thời gian thực!\",\"type\":\"INFO\"}")
                        .description("Thông báo nổi toàn hệ thống xuất hiện trên đầu màn hình chat của người dùng")
                        .build());
            }
            if (systemConfigRepository.findById("banned_keywords").isEmpty()) {
                systemConfigRepository.save(SystemConfig.builder()
                        .key("banned_keywords")
                        .value("lừa đảo, lua dao, hack, 18+, dcm, dkm, đánh bạc, danh bac")
                        .description("Danh sách từ khóa cấm phân cách bằng dấu phẩy, tin nhắn sẽ tự động che dấu ***")
                        .build());
            }
            log.info("Khởi tạo dữ liệu ban đầu cho ứng dụng hoàn tất.");
        };
    }
}
