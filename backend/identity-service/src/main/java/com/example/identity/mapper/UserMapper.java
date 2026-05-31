package com.example.identity.mapper;

import com.example.identity.dto.request.UserCreateRequest;
import com.example.identity.dto.request.UserUpdateRequest;
import com.example.identity.dto.response.UserProfileResponse;
import com.example.identity.dto.response.UserResponse;
import com.example.identity.entity.User;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface UserMapper {

    User toUser(UserCreateRequest request);

    UserResponse toUserResponse(User user);

    UserProfileResponse toUserProfileResponse(User user);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "username", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "googleId", ignore = true)
    void updateUser(@MappingTarget User user, UserUpdateRequest request);
}
