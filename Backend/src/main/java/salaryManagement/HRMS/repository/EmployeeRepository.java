
package salaryManagement.HRMS.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import salaryManagement.HRMS.model.Employee;
import salaryManagement.HRMS.repository.projection.EmployeeListProjection;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, UUID> {

    Optional<Employee> findByEmployeeNumber(String employeeNumber);

    Optional<Employee> findByEmail(String email);

    boolean existsByEmployeeNumber(String employeeNumber);

    boolean existsByEmail(String email);


    @Query("""
        SELECT e
        FROM Employee e
        WHERE LOWER(e.firstName) LIKE LOWER(CONCAT('%', :keyword, '%'))
           OR LOWER(e.lastName) LIKE LOWER(CONCAT('%', :keyword, '%'))
           OR LOWER(CONCAT(e.firstName, ' ', e.lastName))
                LIKE LOWER(CONCAT('%', :keyword, '%'))
           OR LOWER(e.employeeNumber)
                LIKE LOWER(CONCAT('%', :keyword, '%'))
           OR LOWER(e.email)
                LIKE LOWER(CONCAT('%', :keyword, '%'))
        ORDER BY e.firstName ASC, e.lastName ASC
        """)
    Page<Employee> searchEmployees(
            @Param("keyword") String keyword,
            Pageable pageable
    );

    @Query(
            value = """
            SELECT
                e.id AS "id",
                e.employee_number AS "employeeNumber",
                e.first_name AS "firstName",
                e.last_name AS "lastName",
                e.email AS "email",
                e.country_code AS "countryCode",
                e.department_id AS "departmentId",
                dep.name AS "departmentName",
                e.designation_id AS "designationId",
                des.title AS "designationName",
                e.employment_status AS "status",
                e.hire_date AS "hireDate"
            FROM employees e
            LEFT JOIN departments dep
                ON dep.id = e.department_id
            LEFT JOIN designations des
                ON des.id = e.designation_id
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM employees e
            LEFT JOIN departments dep
                ON dep.id = e.department_id
            LEFT JOIN designations des
                ON des.id = e.designation_id
            """,
            nativeQuery = true
    )
    Page<EmployeeListProjection> findAllEmployees(
            Pageable pageable
    );

    Optional<Employee> findByEmployeeNumberOrEmail(String employeeNumber, String email);
}
