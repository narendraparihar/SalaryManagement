
package salaryManagement.HRMS.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public record SalaryPatchRequest(

        @DecimalMin(value = "0.01")
        @Digits(integer = 17, fraction = 2)
        BigDecimal amount,

        @Pattern(regexp = "^[A-Za-z]{3}$")
        String currency,

        LocalDate effectiveFrom,

        LocalDate effectiveTo
) {}
