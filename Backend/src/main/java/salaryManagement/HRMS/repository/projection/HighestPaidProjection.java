
package salaryManagement.HRMS.repository.projection;

import java.math.BigDecimal;
import java.util.UUID;

public interface HighestPaidProjection {
    String getEmployeeNumber();
    String getFirstName();
    String getLastName();
    String getCountryName();
    String getDepartmentName();
    BigDecimal getAnnualAmount();
    String getCurrencyCode();
}
