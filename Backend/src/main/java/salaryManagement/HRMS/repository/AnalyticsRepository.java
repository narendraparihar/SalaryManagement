
package salaryManagement.HRMS.repository;

import salaryManagement.HRMS.repository.projection.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import salaryManagement.HRMS.model.Salary;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface AnalyticsRepository
        extends JpaRepository<Salary, UUID> {

    @Query(value = """
        SELECT COUNT(*)
        FROM employees e
        WHERE e.employment_status = 'ACTIVE'
        """, nativeQuery = true)
    long countActiveEmployees();

    @Query(value = """
        SELECT s.currency_code AS "currencyCode",
               COUNT(*) AS "employeeCount",
               SUM(s.annual_amount) AS "totalSalary",
               AVG(s.annual_amount) AS "averageSalary",
               MIN(s.annual_amount) AS "minimumSalary",
               MAX(s.annual_amount) AS "maximumSalary"
        FROM employees e
        JOIN salaries s ON s.employee_id = e.id
        WHERE e.employment_status = 'ACTIVE'
          AND s.effective_from <= :asOf
          AND (s.effective_to IS NULL OR s.effective_to >= :asOf)
        GROUP BY s.currency_code
        ORDER BY s.currency_code
        """, nativeQuery = true)
    List<OverviewSalaryProjection> findOverviewSalaryStats(
            @Param("asOf") LocalDate asOf
    );

    @Query(value = """
        SELECT c.code AS "countryCode",
               c.name AS "countryName",
               s.currency_code AS "currencyCode",
               COUNT(*) AS "employeeCount",
               AVG(s.annual_amount) AS "averageSalary",
               MIN(s.annual_amount) AS "minimumSalary",
               MAX(s.annual_amount) AS "maximumSalary",
               SUM(s.annual_amount) AS "totalSalary"
        FROM employees e
        JOIN countries c ON c.code = e.country_code
        JOIN salaries s ON s.employee_id = e.id
        WHERE e.employment_status = 'ACTIVE'
          AND s.effective_from <= :asOf
          AND (s.effective_to IS NULL OR s.effective_to >= :asOf)
          AND (:countryCode IS NULL OR e.country_code = :countryCode)
          AND (:currencyCode IS NULL OR s.currency_code = :currencyCode)
        GROUP BY c.code, c.name, s.currency_code
        ORDER BY c.name, s.currency_code
        """, nativeQuery = true)
    List<CountrySalaryProjection> findSalaryStatsByCountry(
            @Param("asOf") LocalDate asOf,
            @Param("countryCode") String countryCode,
            @Param("currencyCode") String currencyCode
    );

    @Query(value = """
        SELECT d.id AS "departmentId",
               d.name AS "departmentName",
               s.currency_code AS "currencyCode",
               COUNT(*) AS "employeeCount",
               AVG(s.annual_amount) AS "averageSalary",
               MIN(s.annual_amount) AS "minimumSalary",
               MAX(s.annual_amount) AS "maximumSalary",
               SUM(s.annual_amount) AS "totalSalary"
        FROM employees e
        JOIN departments d ON d.id = e.department_id
        JOIN salaries s ON s.employee_id = e.id
        WHERE e.employment_status = 'ACTIVE'
          AND s.effective_from <= :asOf
          AND (s.effective_to IS NULL OR s.effective_to >= :asOf)
          AND (:departmentId IS NULL OR d.id = :departmentId)
          AND (:currencyCode IS NULL OR s.currency_code = :currencyCode)
        GROUP BY d.id, d.name, s.currency_code
        ORDER BY d.name, s.currency_code
        """, nativeQuery = true)
    List<DepartmentSalaryProjection> findSalaryStatsByDepartment(
            @Param("asOf") LocalDate asOf,
            @Param("departmentId") Long departmentId,
            @Param("currencyCode") String currencyCode
    );

    @Query(value = """
        SELECT
          CASE
            WHEN s.annual_amount < 30000 THEN 'Under 30,000'
            WHEN s.annual_amount < 60000 THEN '30,000 - 59,999'
            WHEN s.annual_amount < 100000 THEN '60,000 - 99,999'
            WHEN s.annual_amount < 150000 THEN '100,000 - 149,999'
            ELSE '150,000 and above'
          END AS "salaryRange",
          CASE
            WHEN s.annual_amount < 30000 THEN 1
            WHEN s.annual_amount < 60000 THEN 2
            WHEN s.annual_amount < 100000 THEN 3
            WHEN s.annual_amount < 150000 THEN 4
            ELSE 5
          END AS "rangeOrder",
          COUNT(*) AS "employeeCount"
        FROM employees e
        JOIN salaries s ON s.employee_id = e.id
        WHERE e.employment_status = 'ACTIVE'
          AND s.effective_from <= :asOf
          AND (s.effective_to IS NULL OR s.effective_to >= :asOf)
          AND s.currency_code = :currencyCode
          AND (:countryCode IS NULL OR e.country_code = :countryCode)
          AND (:departmentId IS NULL OR e.department_id = :departmentId)
        GROUP BY "salaryRange", "rangeOrder"
        ORDER BY "rangeOrder"
        """, nativeQuery = true)
    List<SalaryDistributionProjection> findSalaryDistribution(
            @Param("asOf") LocalDate asOf,
            @Param("currencyCode") String currencyCode,
            @Param("countryCode") String countryCode,
            @Param("departmentId") Long departmentId
    );

    @Query(value = """
        SELECT e.id AS "employeeId",
               e.employee_number AS "employeeNumber",
               e.first_name AS "firstName",
               e.last_name AS "lastName",
               c.name AS "countryName",
               d.name AS "departmentName",
               s.annual_amount AS "annualAmount",
               s.currency_code AS "currencyCode"
        FROM employees e
        JOIN salaries s ON s.employee_id = e.id
        LEFT JOIN countries c ON c.code = e.country_code
        LEFT JOIN departments d ON d.id = e.department_id
        WHERE e.employment_status = 'ACTIVE'
          AND s.effective_from <= :asOf
          AND (s.effective_to IS NULL OR s.effective_to >= :asOf)
          AND (:countryCode IS NULL OR e.country_code = :countryCode)
          AND (:departmentId IS NULL OR e.department_id = :departmentId)
          AND (:currencyCode IS NULL OR s.currency_code = :currencyCode)
        ORDER BY s.annual_amount DESC, e.employee_number ASC
        LIMIT :limit
        """, nativeQuery = true)
    List<HighestPaidProjection> findHighestPaidEmployees(
            @Param("asOf") LocalDate asOf,
            @Param("countryCode") String countryCode,
            @Param("departmentId") Long departmentId,
            @Param("currencyCode") String currencyCode,
            @Param("limit") int limit
    );

    @Query(value = """
        SELECT s.id AS "salaryId",
               e.id AS "employeeId",
               e.employee_number AS "employeeNumber",
               e.first_name AS "firstName",
               e.last_name AS "lastName",
               c.name AS "countryName",
               d.name AS "departmentName",
               s.annual_amount AS "annualAmount",
               s.currency_code AS "currencyCode",
               s.effective_from AS "effectiveFrom",
               s.effective_to AS "effectiveTo"
        FROM employees e
        JOIN salaries s ON s.employee_id = e.id
        LEFT JOIN countries c ON c.code = e.country_code
        LEFT JOIN departments d ON d.id = e.department_id
        WHERE e.employment_status = 'ACTIVE'
          AND s.effective_from <= :asOf
          AND (s.effective_to IS NULL OR s.effective_to >= :asOf)
          AND (:countryCode IS NULL OR e.country_code = :countryCode)
          AND (:departmentId IS NULL OR e.department_id = :departmentId)
          AND (:currencyCode IS NULL OR s.currency_code = :currencyCode)
        ORDER BY e.employee_number
        LIMIT :maxRows
        """, nativeQuery = true)
    List<SalaryExportProjection> findSalaryExportRows(
            @Param("asOf") LocalDate asOf,
            @Param("countryCode") String countryCode,
            @Param("departmentId") Long departmentId,
            @Param("currencyCode") String currencyCode,
            @Param("maxRows") int maxRows
    );
}
