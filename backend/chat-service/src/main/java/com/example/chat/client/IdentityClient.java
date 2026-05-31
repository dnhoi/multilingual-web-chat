package com.example.chat.client;

import com.example.chat.config.WebSocketFeignInterceptor;
import com.example.chat.dto.response.ApiResponse;
import com.example.chat.dto.response.UserProfileResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * Feign Client giao tiếp với Identity Service để lấy thông tin hồ sơ người dùng theo userId.
 */
@FeignClient(name = "identity-client", url = "${app.identify.url}", configuration = WebSocketFeignInterceptor.class)
public interface IdentityClient {

    /**
     * Lấy thông tin hồ sơ của người dùng theo mã định danh.
     *
     * @param userId Mã người dùng cần truy vấn
     * @return Thông tin chi tiết của người dùng
     */
    @GetMapping("/users/{userId}")
    ApiResponse<UserProfileResponse> getInfo(@PathVariable("userId") String userId);
}
