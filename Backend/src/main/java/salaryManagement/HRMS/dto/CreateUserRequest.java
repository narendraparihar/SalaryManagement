package salaryManagement.HRMS.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(

        @NotBlank
        @Email
        @Size(max = 255)
        String email,

        // Supply a raw password for password-based accounts.
        // The service hashes it before persistence.
        @Size(min = 8, max = 128)
        String password,

        @Size(max = 50)
        String identityProvider,

        @Size(max = 255)
        String identitySubject,

        Boolean isActive
) {}