package salaryManagement.HRMS.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record SalaryResponse(
        UUID id,
        UUID employeeId,
        String name,
        BigDecimal amount,
        String currency,
        String createdBy,
        LocalDate createdAt,
        LocalDate effectiveFrom,
        LocalDate effectiveTo
) {}