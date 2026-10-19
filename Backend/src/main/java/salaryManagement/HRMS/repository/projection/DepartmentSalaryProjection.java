
package salaryManagement.HRMS.repository.projection;

import java.math.BigDecimal;

public interface DepartmentSalaryProjection {
    Long getDepartmentId();
    String getDepartmentName();
    String getCurrencyCode();
    Long getEmployeeCount();
    BigDecimal getAverageSalary();
    BigDecimal getMinimumSalary();
    BigDecimal getMaximumSalary();
    BigDecimal getTotalSalary();
}
