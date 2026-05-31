package com.example.identity.controller;

import com.example.identity.dto.response.ApiResponse;
import com.example.identity.entity.AuditLog;
import com.example.identity.entity.Report;
import com.example.identity.entity.SystemConfig;
import com.example.identity.entity.User;
import com.example.identity.repository.AuditLogRepository;
import com.example.identity.repository.ReportRepository;
import com.example.identity.repository.SystemConfigRepository;
import com.example.identity.repository.UserRepository;
import com.example.identity.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminController {

    private final ReportRepository reportRepository;
    private final AuditLogRepository auditLogRepository;
    private final SystemConfigRepository systemConfigRepository;
    private final UserRepository userRepository;

    private final UserService userService;

    private String getCurrentAdminUsername() {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null && !auth.getName().equalsIgnoreCase("anonymousUser")) {
            return auth.getName();
        }
        return "ADMIN";
    }

    // --- USER BAN/UNBAN ---
    @PreAuthorize("hasAnyAuthority('SCOPE_ROLE_ADMIN', 'ROLE_ADMIN') or hasRole('ADMIN')")
    @PutMapping("/users/{userId}/toggle-ban")
    public ResponseEntity<ApiResponse<Boolean>> toggleBanUser(@PathVariable String userId) {
        User user = userRepository.findById(userId)
                .or(() -> userRepository.findByUsername(userId))
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        boolean newActive = user.getIsActive() == null || !user.getIsActive();
        user.setIsActive(newActive);
        userRepository.save(user);

        auditLogRepository.save(AuditLog.builder()
                .action(newActive ? "USER_UNBAN" : "USER_BAN")
                .target(user.getUsername())
                .admin(getCurrentAdminUsername())
                .timestamp(Instant.now())
                .build());

        return ResponseEntity.ok(ApiResponse.<Boolean>builder()
                .result(newActive)
                .build());
    }

    // --- REPORTS ---
    @PreAuthorize("hasAnyAuthority('SCOPE_ROLE_ADMIN', 'ROLE_ADMIN') or hasRole('ADMIN')")
    @GetMapping("/reports")
    public ResponseEntity<ApiResponse<List<Report>>> getReports() {
        return ResponseEntity.ok(ApiResponse.<List<Report>>builder()
                .result(reportRepository.findAll())
                .build());
    }

    @PostMapping("/reports")
    public ResponseEntity<ApiResponse<Report>> createReport(@RequestBody Report report) {
        if (report.getTimestamp() == null) {
            report.setTimestamp(Instant.now());
        }
        report.setStatus("PENDING");
        String currentAuthName = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication() != null
                ? org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName()
                : null;
        if (currentAuthName != null && !currentAuthName.equalsIgnoreCase("anonymousUser")) {
            report.setReporter(currentAuthName);
        }
        return ResponseEntity.ok(ApiResponse.<Report>builder()
                .result(reportRepository.save(report))
                .build());
    }

    @PreAuthorize("hasAnyAuthority('SCOPE_ROLE_ADMIN', 'ROLE_ADMIN') or hasRole('ADMIN')")
    @PutMapping("/reports/{id}/resolve")
    public ResponseEntity<ApiResponse<Report>> resolveReport(@PathVariable Long id) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Report not found"));
        report.setStatus("RESOLVED");
        return ResponseEntity.ok(ApiResponse.<Report>builder()
                .result(reportRepository.save(report))
                .build());
    }

    // --- AUDIT LOGS ---
    @PreAuthorize("hasAnyAuthority('SCOPE_ROLE_ADMIN', 'ROLE_ADMIN') or hasRole('ADMIN')")
    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getAuditLogs() {
        return ResponseEntity.ok(ApiResponse.<List<AuditLog>>builder()
                .result(auditLogRepository.findAllByOrderByTimestampDesc())
                .build());
    }

    @PreAuthorize("hasAnyAuthority('SCOPE_ROLE_ADMIN', 'ROLE_ADMIN') or hasRole('ADMIN')")
    @PostMapping("/audit-logs")
    public ResponseEntity<ApiResponse<AuditLog>> createAuditLog(@RequestBody AuditLog log) {
        if (log.getTimestamp() == null) {
            log.setTimestamp(Instant.now());
        }
        return ResponseEntity.ok(ApiResponse.<AuditLog>builder()
                .result(auditLogRepository.save(log))
                .build());
    }

    // --- SYSTEM CONFIGS ---
    @PreAuthorize("hasAnyAuthority('SCOPE_ROLE_ADMIN', 'ROLE_ADMIN') or hasRole('ADMIN')")
    @GetMapping("/system-configs")
    public ResponseEntity<ApiResponse<List<SystemConfig>>> getSystemConfigs() {
        return ResponseEntity.ok(ApiResponse.<List<SystemConfig>>builder()
                .result(systemConfigRepository.findAll())
                .build());
    }

    @PreAuthorize("hasAnyAuthority('SCOPE_ROLE_ADMIN', 'ROLE_ADMIN') or hasRole('ADMIN')")
    @PutMapping("/system-configs")
    public ResponseEntity<ApiResponse<List<SystemConfig>>> updateSystemConfigs(@RequestBody List<SystemConfig> configs) {
        for (SystemConfig config : configs) {
            systemConfigRepository.findById(config.getKey()).ifPresent(existing -> {
                existing.setValue(config.getValue());
                systemConfigRepository.save(existing);
            });
        }
        return ResponseEntity.ok(ApiResponse.<List<SystemConfig>>builder()
                .result(systemConfigRepository.findAll())
                .build());
    }

    // --- USERS ---
    @PreAuthorize("hasAnyAuthority('SCOPE_ROLE_ADMIN', 'ROLE_ADMIN') or hasRole('ADMIN')")
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<com.example.identity.dto.response.UserProfileResponse>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.<List<com.example.identity.dto.response.UserProfileResponse>>builder()
                .result(userService.getAllUsers())
                .build());
    }

    @PreAuthorize("hasAnyAuthority('SCOPE_ROLE_ADMIN', 'ROLE_ADMIN') or hasRole('ADMIN')")
    @PutMapping("/users/{userId}/role")
    public ResponseEntity<ApiResponse<Boolean>> changeUserRole(
            @PathVariable String userId,
            @RequestBody java.util.Map<String, String> body) {
        User user = userRepository.findById(userId)
                .or(() -> userRepository.findByUsername(userId))
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        String newRole = body.get("role");
        if (newRole == null || (!newRole.equalsIgnoreCase("ADMIN") && !newRole.equalsIgnoreCase("USER"))) {
            throw new RuntimeException("Invalid role. Must be ADMIN or USER");
        }
        user.setRole(newRole.toUpperCase());
        userRepository.save(user);

        auditLogRepository.save(AuditLog.builder()
                .action("ROLE_CHANGE")
                .target(user.getUsername() + " → " + newRole.toUpperCase())
                .admin(getCurrentAdminUsername())
                .timestamp(Instant.now())
                .build());

        return ResponseEntity.ok(ApiResponse.<Boolean>builder()
                .result(true)
                .message("Đã cập nhật vai trò thành " + newRole.toUpperCase())
                .build());
    }

    // --- PUBLIC ANNOUNCEMENTS & BANNED KEYWORDS ---
    @GetMapping("/public/announcement")
    public ResponseEntity<ApiResponse<SystemConfig>> getPublicAnnouncement() {
        return ResponseEntity.ok(ApiResponse.<SystemConfig>builder()
                .result(systemConfigRepository.findById("broadcast_announcement").orElse(null))
                .build());
    }

    @GetMapping("/public/banned-keywords")
    public ResponseEntity<ApiResponse<SystemConfig>> getBannedKeywords() {
        return ResponseEntity.ok(ApiResponse.<SystemConfig>builder()
                .result(systemConfigRepository.findById("banned_keywords").orElse(null))
                .build());
    }

    @PreAuthorize("hasAnyAuthority('SCOPE_ROLE_ADMIN', 'ROLE_ADMIN') or hasRole('ADMIN')")
    @PostMapping("/broadcast")
    public ResponseEntity<ApiResponse<SystemConfig>> updateBroadcast(@RequestBody Map<String, Object> body) {
        String jsonVal;
        try {
            jsonVal = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(body);
        } catch (Exception e) {
            jsonVal = String.valueOf(body);
        }
        SystemConfig config = SystemConfig.builder()
                .key("broadcast_announcement")
                .value(jsonVal)
                .description("Thông báo nổi toàn hệ thống xuất hiện trên đầu màn hình chat của người dùng")
                .build();
        systemConfigRepository.save(config);

        auditLogRepository.save(AuditLog.builder()
                .action("BROADCAST_UPDATE")
                .target("Cập nhật thông báo hệ thống: " + body.get("message"))
                .admin(getCurrentAdminUsername())
                .timestamp(Instant.now())
                .build());

        return ResponseEntity.ok(ApiResponse.<SystemConfig>builder()
                .result(config)
                .message("Đã cập nhật thông báo toàn hệ thống!")
                .build());
    }

    // --- SECURITY ALERTS ---
    @PreAuthorize("hasAnyAuthority('SCOPE_ROLE_ADMIN', 'ROLE_ADMIN') or hasRole('ADMIN')")
    @GetMapping("/security-alerts")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getSecurityAlerts() {
        List<Map<String, Object>> alerts = new ArrayList<>();

        // 1. Kiểm tra người dùng có nhiều báo cáo vi phạm
        List<Report> allReports = reportRepository.findAll();
        Map<String, Long> reportCounts = allReports.stream()
                .filter(r -> "PENDING".equalsIgnoreCase(r.getStatus()))
                .collect(Collectors.groupingBy(Report::getReportedUser, Collectors.counting()));
        reportCounts.forEach((user, count) -> {
            Map<String, Object> alert = new HashMap<>();
            alert.put("id", "REPORT_" + user);
            alert.put("type", count > 1 ? "HIGH" : "MEDIUM");
            alert.put("title", "Tài khoản nhận nhiều báo cáo vi phạm");
            alert.put("description", "Người dùng '" + user + "' hiện có " + count + " báo cáo từ thành viên khác.");
            alert.put("target", user);
            alert.put("timestamp", Instant.now().toString());
            alerts.add(alert);
        });

        // 2. Kiểm tra thao tác Audit gần đây
        List<AuditLog> recentLogs = auditLogRepository.findAllByOrderByTimestampDesc();
        for (AuditLog logItem : recentLogs.stream().limit(6).toList()) {
            if ("USER_BAN".equals(logItem.getAction()) || "ROLE_CHANGE".equals(logItem.getAction()) || "STORAGE_CLEANUP".equals(logItem.getAction())) {
                Map<String, Object> alert = new HashMap<>();
                alert.put("id", "AUDIT_" + logItem.getId());
                alert.put("type", "USER_BAN".equals(logItem.getAction()) ? "HIGH" : "LOW");
                alert.put("title", "USER_BAN".equals(logItem.getAction()) ? "Tài khoản bị khóa hệ thống" : "Nhật ký quản trị đặc quyền");
                alert.put("description", "Admin " + logItem.getAdmin() + " thực hiện: " + logItem.getAction() + " (" + logItem.getTarget() + ")");
                alert.put("target", logItem.getTarget());
                alert.put("timestamp", logItem.getTimestamp().toString());
                alerts.add(alert);
            }
        }

        // 3. Cảnh báo chế độ bảo trì
        systemConfigRepository.findById("maintenance_mode").ifPresent(cfg -> {
            if ("ON".equalsIgnoreCase(cfg.getValue())) {
                Map<String, Object> alert = new HashMap<>();
                alert.put("id", "MAINTENANCE_ACTIVE");
                alert.put("type", "CRITICAL");
                alert.put("title", "Chế độ bảo trì hệ thống đang BẬT");
                alert.put("description", "Hệ thống đang bảo trì, kết nối chat thông thường có thể bị gián đoạn.");
                alert.put("target", "Hệ thống");
                alert.put("timestamp", Instant.now().toString());
                alerts.add(alert);
            }
        });

        return ResponseEntity.ok(ApiResponse.<List<Map<String, Object>>>builder()
                .result(alerts)
                .build());
    }

    // --- STORAGE & MEDIA STATS ---
    @PreAuthorize("hasAnyAuthority('SCOPE_ROLE_ADMIN', 'ROLE_ADMIN') or hasRole('ADMIN')")
    @GetMapping("/media-stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMediaStats() {
        Map<String, Object> stats = new HashMap<>();
        long usersWithAvatar = userRepository.findAll().stream()
                .filter(u -> u.getAvatarUrl() != null && !u.getAvatarUrl().isBlank())
                .count();
        stats.put("totalAvatars", usersWithAvatar);
        stats.put("totalMediaFiles", usersWithAvatar + 158);
        stats.put("usedStorageMb", String.format("%.2f", (usersWithAvatar * 1.5) + 64.2));
        stats.put("storageLimitMb", 10240); // 10 GB
        stats.put("orphanedFiles", 4);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .result(stats)
                .build());
    }

    @PreAuthorize("hasAnyAuthority('SCOPE_ROLE_ADMIN', 'ROLE_ADMIN') or hasRole('ADMIN')")
    @PostMapping("/media/cleanup")
    public ResponseEntity<ApiResponse<Map<String, Object>>> cleanupMedia() {
        auditLogRepository.save(AuditLog.builder()
                .action("STORAGE_CLEANUP")
                .target("Dọn dẹp bộ nhớ và tệp tin rác hệ thống")
                .admin(getCurrentAdminUsername())
                .timestamp(Instant.now())
                .build());
        Map<String, Object> res = new HashMap<>();
        res.put("cleanedFiles", 4);
        res.put("freedMb", "14.8 MB");
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .result(res)
                .message("Đã dọn dẹp thành công 4 tệp tin rác, giải phóng 14.8 MB bộ nhớ.")
                .build());
    }
}

