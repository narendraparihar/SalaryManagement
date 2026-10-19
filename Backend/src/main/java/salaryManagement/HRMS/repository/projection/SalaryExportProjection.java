
package salaryManagement.HRMS.repository.projection;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public interface SalaryExportProjection {
    UUID getSalaryId();
    UUID getEmployeeId();
    String getEmployeeNumber();
    String getFirstName();
    String getLastName();
    String getCountryName();
    String getDepartmentName();
    BigDecimal getAnnualAmount();
    String getCurrencyCode();
    LocalDate getEffectiveFrom();
    LocalDate getEffectiveTo();
}
