
package salaryManagement.HRMS.repository;

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
}
