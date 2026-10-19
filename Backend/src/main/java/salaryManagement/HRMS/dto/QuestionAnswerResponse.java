
package salaryManagement.HRMS.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;

public record QuestionAnswerResponse(

        String question,
        String status,
        String metric,
        QuestionFilters filters,

        @JsonProperty("currency_code")
        String currencyCode,

        BigDecimal value,

        @JsonProperty("employee_count")
        Long employeeCount,

        String explanation
) {

    public record QuestionFilters(
            String country,

            @JsonProperty("as_of_date")
            String asOfDate
    ) {}
}
