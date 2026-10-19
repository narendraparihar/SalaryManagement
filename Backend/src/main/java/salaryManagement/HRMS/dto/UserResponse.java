package salaryManagement.HRMS.dto;

import java.time.Instant;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String identityProvider,
        String identitySubject,
        boolean isActive,
        Instant createdAt,
        Instant updatedAt
) {}