
package salaryManagement.HRMS.repository;

import salaryManagement.HRMS.model.Salary;
import salaryManagement.HRMS.repository.projection.QuestionAggregateProjection;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.UUID;

public interface QuestionRepository
        extends JpaRepository<Salary, UUID> {

    @Query(value = """
        SELECT
            COUNT(DISTINCT e.id) AS "employeeCount",
            AVG(s.annual_amount) AS "averageSalary",
            SUM(s.annual_amount) AS "totalSalary",
            MIN(s.annual_amount) AS "minimumSalary",
            MAX(s.annual_amount) AS "maximumSalary"
        FROM employees e
        JOIN salaries s ON s.employee_id = e.id
        WHERE e.employment_status = 'ACTIVE'
          AND e.country_code = :countryCode
          AND s.currency_code = :currencyCode
          AND s.effective_from <= :asOfDate
          AND (
              s.effective_to IS NULL
              OR s.effective_to >= :asOfDate
          )
        """, nativeQuery = true)
    QuestionAggregateProjection getSalaryAggregate(
            @Param("countryCode") String countryCode,
            @Param("currencyCode") String currencyCode,
            @Param("asOfDate") LocalDate asOfDate
    );
}
