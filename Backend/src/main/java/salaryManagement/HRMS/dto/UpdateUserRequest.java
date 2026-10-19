package salaryManagement.HRMS.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(

        @Email
        @Size(max = 255)
        String email,

        @Size(min = 8, max = 128)
        String password,

        @Size(max = 50)
        String identityProvider,

        @Size(max = 255)
        String identitySubject,

        Boolean isActive
) {}