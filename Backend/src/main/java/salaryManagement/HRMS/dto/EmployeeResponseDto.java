package salaryManagement.HRMS.dto;

import java.time.LocalDate;
import java.util.UUID;

public record EmployeeResponseDto(
        UUID id,
        String employeeNumber,
        String firstName,
        String lastName,
        String email,
        String countryCode,
        Long departmentId,
        String departmentName,
        Long designationId,
        String designationName,
        String status,
        LocalDate hireDate
) {}