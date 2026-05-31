package com.example.chat.client;

import com.example.chat.dto.request.TranslateRequest;
import com.example.chat.dto.response.TranslateResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * Feign Client kết nối tới dịch vụ dịch thuật đa ngôn ngữ tự động (Translation Service).
 */
@FeignClient(name = "translate-client", url = "${app.translate.url}")
public interface TranslateClient {

    /**
     * Gửi yêu cầu dịch văn bản sang ngôn ngữ đích của cuộc hội thoại.
     *
     * @param content Đối tượng chứa nội dung văn bản và ngôn ngữ đích cần dịch
     * @return Kết quả văn bản đã dịch
     */
    @PostMapping
    TranslateResponse translate(@RequestBody TranslateRequest content);
}
