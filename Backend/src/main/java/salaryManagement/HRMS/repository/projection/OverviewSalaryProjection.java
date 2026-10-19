
package salaryManagement.HRMS.repository.projection;

import java.math.BigDecimal;

public interface OverviewSalaryProjection {
    String getCurrencyCode();
    Long getEmployeeCount();
    BigDecimal getTotalSalary();
    BigDecimal getAverageSalary();
    BigDecimal getMinimumSalary();
    BigDecimal getMaximumSalary();
}
