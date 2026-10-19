
package salaryManagement.HRMS.repository.projection;

import java.math.BigDecimal;

public interface CountrySalaryProjection {
    String getCountryCode();
    String getCountryName();
    String getCurrencyCode();
    Long getEmployeeCount();
    BigDecimal getAverageSalary();
    BigDecimal getMinimumSalary();
    BigDecimal getMaximumSalary();
    BigDecimal getTotalSalary();
}
