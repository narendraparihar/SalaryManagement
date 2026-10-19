package salaryManagement.HRMS.service;

import salaryManagement.HRMS.dto.CreateUserRequest;
import salaryManagement.HRMS.dto.UpdateUserRequest;
import salaryManagement.HRMS.dto.UserResponse;

import java.util.List;
import java.util.UUID;

public interface UserService {

    UserResponse createUser(CreateUserRequest request);

    UserResponse getUserById(UUID id);

    List<UserResponse> getAllUsers();

    UserResponse updateUser(UUID id, UpdateUserRequest request);

    void deactivateUser(UUID id);
}