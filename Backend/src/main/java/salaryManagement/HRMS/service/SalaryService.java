
package salaryManagement.HRMS.service;

import salaryManagement.HRMS.dto.SalaryCreateRequest;
import salaryManagement.HRMS.dto.SalaryPatchRequest;
import salaryManagement.HRMS.dto.SalaryResponse;
import salaryManagement.HRMS.model.Employee;
import salaryManagement.HRMS.model.Salary;
import salaryManagement.HRMS.repository.EmployeeRepository;
import salaryManagement.HRMS.repository.SalaryRepository;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;

import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class SalaryService {

    private final SalaryRepository salaryRepository;
    private final EmployeeRepository employeeRepository;

    public SalaryService(
            SalaryRepository salaryRepository,
            EmployeeRepository employeeRepository) {
        this.salaryRepository = salaryRepository;
        this.employeeRepository = employeeRepository;
    }

    public SalaryResponse createSalary(
            UUID employeeId,
            SalaryCreateRequest request) {

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Employee not found: " + employeeId
                ));

        validateDates(request.effectiveFrom(), request.effectiveTo());

        Salary salary = new Salary();
        salary.setEmployee(employee);
        salary.setAmount(request.amount());
        salary.setCurrency(request.currency().toUpperCase());
        salary.setEffectiveFrom(request.effectiveFrom());
        salary.setEffectiveTo(request.effectiveTo());

        String username = currentUsername();
        salary.setCreatedBy(username);

        Salary saved = salaryRepository.save(salary);

        return toResponse(saved);
    }

    @Transactional(Transactional.TxType.SUPPORTS)
    public List<SalaryResponse> getSalaryHistory(UUID employeeId) {

        if (!employeeRepository.existsById(employeeId)) {
            throw new EntityNotFoundException(
                    "Employee not found: " + employeeId
            );
        }

        return salaryRepository
                .findByEmployee_IdOrderByEffectiveFromDesc(employeeId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(Transactional.TxType.SUPPORTS)
    public SalaryResponse getSalaryById(UUID salaryId) {

        Salary salary = salaryRepository.findById(salaryId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Salary record not found: " + salaryId
                ));

        return toResponse(salary);
    }

    public SalaryResponse updateSalary(
            UUID salaryId,
            SalaryPatchRequest request) {

        Salary salary = salaryRepository.findById(salaryId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Salary record not found: " + salaryId
                ));

        if (request.amount() != null) {
            salary.setAmount(request.amount());
        }

        if (request.currency() != null) {
            salary.setCurrency(request.currency().toUpperCase());
        }

        if (request.effectiveFrom() != null) {
            salary.setEffectiveFrom(request.effectiveFrom());
        }

        if (request.effectiveTo() != null) {
            salary.setEffectiveTo(request.effectiveTo());
        }

        validateDates(
                salary.getEffectiveFrom(),
                salary.getEffectiveTo()
        );

        // JPA updates the managed entity at transaction commit.
        Salary updated = salaryRepository.save(salary);

        return toResponse(updated);
    }

    @Transactional(Transactional.TxType.SUPPORTS)
    public List<SalaryResponse> getCurrentSalaries() {

        LocalDate today = LocalDate.now();

        return salaryRepository
                .findByEffectiveFromLessThanEqualAndEffectiveToIsNull(today)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private void validateDates(
            LocalDate effectiveFrom,
            LocalDate effectiveTo) {

        if (effectiveFrom == null) {
            throw new IllegalArgumentException(
                    "Effective from date is required"
            );
        }

        if (effectiveTo != null && effectiveTo.isBefore(effectiveFrom)) {
            throw new IllegalArgumentException(
                    "Effective to date cannot be before effective from date"
            );
        }
    }

    private String currentUsername() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Authenticated user is required for salary changes"
            );
        }

        return authentication.getName();
    }

    private SalaryResponse toResponse(Salary salary) {
        return new SalaryResponse(
                salary.getId(),
                salary.getEmployee().getId(),
                salary.getAmount(),
                salary.getCurrency(),
                salary.getEffectiveFrom(),
                salary.getEffectiveTo(),
                salary.getCreatedAt(),
                salary.getCreatedBy()
        );
    }
}
