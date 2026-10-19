
package salaryManagement.HRMS.repository.projection;

import java.math.BigDecimal;

public interface QuestionAggregateProjection {

    Long getEmployeeCount();

    BigDecimal getAverageSalary();

    BigDecimal getTotalSalary();

    BigDecimal getMinimumSalary();

    BigDecimal getMaximumSalary();
}
