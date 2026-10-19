package salaryManagement.HRMS.dto.auth;

import java.util.UUID;

public record AuthResponse(
        UUID id,
        String email,
        String message
) {}