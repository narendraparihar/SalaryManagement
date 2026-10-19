
package salaryManagement.HRMS.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record QuestionRequest(

        @NotBlank
        @Size(max = 500)
        String question,

        @JsonProperty("as_of_date")
        LocalDate asOfDate
) {}
