
package salaryManagement.HRMS.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import salaryManagement.HRMS.dto.SalaryResponse;
import salaryManagement.HRMS.model.Salary;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface SalaryRepository
        extends JpaRepository<Salary, UUID> {

    List<Salary> findByEmployee_IdOrderByEffectiveFromDesc(
            UUID employeeId
    );

    List<Salary> findByEffectiveFromLessThanEqualAndEffectiveToIsNull(
            LocalDate date
    );

    boolean existsByEmployee_IdAndEffectiveFromAndEffectiveToIsNull(
            UUID employeeId,
            LocalDate effectiveFrom
    );
    @Query("""
        SELECT new salaryManagement.HRMS.dto.SalaryResponse(
            s.id,
            e.id,
            CONCAT(e.firstName, ' ', e.lastName),
            s.amount,
            s.currency,
            s.createdBy,
            s.createdAt,
            s.effectiveFrom,
            s.effectiveTo
        )
        FROM Salary s
        JOIN s.employee e
        WHERE s.effectiveFrom <= :date
          AND (s.effectiveTo IS NULL OR s.effectiveTo >= :date)
        ORDER BY s.effectiveFrom DESC
        """)
    Page<SalaryResponse> findCurrentSalaries(
            @Param("date") LocalDate date,
            Pageable pageable
    );

    @Query("""
    SELECT new salaryManagement.HRMS.dto.SalaryResponse(
         s.id,
            e.id,
            CONCAT(e.firstName, ' ', e.lastName),
            s.amount,
            s.currency,
            s.createdBy,
            s.createdAt,
            s.effectiveFrom,
            s.effectiveTo
    )
    FROM Salary s
    JOIN s.employee e
    WHERE LOWER(CONCAT(e.firstName, ' ', e.lastName))
          LIKE LOWER(CONCAT('%', :keyword, '%'))
    ORDER BY e.firstName ASC
    """)
    Page<SalaryResponse> searchSalaries(
            @Param("keyword") String keyword,
            Pageable pageable
    );
}
