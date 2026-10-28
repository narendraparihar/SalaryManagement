package salaryManagement.HRMS.repository.projection;

import java.time.LocalDate;
import java.util.UUID;

public interface EmployeeListProjection {

    UUID getId();

    String getEmployeeNumber();

    String getFirstName();

    String getLastName();

    String getEmail();

    String getCountryCode();

    Long getDepartmentId();

    String getDepartmentName();

    Long getDesignationId();

    String getDesignationName();

    String getStatus();

    LocalDate getHireDate();
}