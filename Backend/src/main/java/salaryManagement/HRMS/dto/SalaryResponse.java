
package salaryManagement.HRMS.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record SalaryResponse(
        UUID id,
        UUID employeeId,
        BigDecimal amount,
        String currency,
        LocalDate effectiveFrom,
        LocalDate effectiveTo,
        Instant createdAt,
        String createdBy
) {}
