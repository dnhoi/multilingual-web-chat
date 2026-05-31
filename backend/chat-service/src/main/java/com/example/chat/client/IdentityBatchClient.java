package com.example.chat.client;

import com.example.chat.config.AuthenticationRequestInterceptor;
import com.example.chat.dto.request.UserIdsRequest;
import com.example.chat.dto.response.ApiResponse;
import com.example.chat.dto.response.UserProfileResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

/**
 * Feign Client giao tiếp với Identity Service để lấy thông tin hồ sơ hàng loạt theo danh sách userId.
 */
@FeignClient(name = "identity-batch-client", url = "${app.identify.url}", configuration = {AuthenticationRequestInterceptor.class})
public interface IdentityBatchClient {

    /**
     * Lấy thông tin hồ sơ của nhiều người dùng cùng lúc (batching) để tối ưu hiệu năng.
     *
     * @param userIdsRequest Đối tượng chứa danh sách các userId cần truy vấn
     * @return Danh sách thông tin người dùng tương ứng
     */
    @PostMapping("/users/batch")
    ApiResponse<List<UserProfileResponse>> getBatchInfo(@RequestBody UserIdsRequest userIdsRequest);
}
