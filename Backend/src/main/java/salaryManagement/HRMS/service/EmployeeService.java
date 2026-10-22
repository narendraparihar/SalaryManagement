
package salaryManagement.HRMS.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import salaryManagement.HRMS.model.Employee;
import salaryManagement.HRMS.repository.EmployeeRepository;

import java.util.UUID;

@Service
@Transactional
public class EmployeeService {

    private final EmployeeRepository employeeRepository;

    public EmployeeService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    // Create employee
    public Employee createEmployee(Employee employee) {
        if (employeeRepository.existsByEmployeeNumber(
                employee.getEmployeeNumber())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Employee number already exists"
            );
        }

        if (employeeRepository.existsByEmail(employee.getEmail())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Email already exists"
            );
        }

        employee.setId(null);
        return employeeRepository.save(employee);
    }

    // Get employee by UUID
    @Transactional(readOnly = true)
    public Employee getEmployeeById(UUID id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Employee not found: " + id
                ));
    }

    // Get all employees with pagination
    @Transactional(readOnly = true)
    public Page<Employee> getAllEmployees(Pageable pageable) {
        return employeeRepository.findAll(pageable);
    }

    // Update employee
    public Employee updateEmployee(UUID id, Employee request) {
        Employee existing = getEmployeeById(id);

        employeeRepository.findByEmployeeNumber(
                        request.getEmployeeNumber()
                ).filter(e -> !e.getId().equals(id))
                .ifPresent(e -> {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "Employee number already exists"
                    );
                });

        employeeRepository.findByEmail(request.getEmail())
                .filter(e -> !e.getId().equals(id))
                .ifPresent(e -> {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "Email already exists"
                    );
                });

        existing.setEmployeeNumber(request.getEmployeeNumber());
        existing.setFirstName(request.getFirstName());
        existing.setLastName(request.getLastName());
        existing.setEmail(request.getEmail());
        existing.setCountryCode(request.getCountryCode());
        existing.setDepartmentId(request.getDepartmentId());
        existing.setDesignationId(request.getDesignationId());
        existing.setEmploymentStatus(request.getEmploymentStatus());
        existing.setHireDate(request.getHireDate());

        return employeeRepository.save(existing);
    }

    // Delete employee
    public void deleteEmployee(UUID id) {
        Employee employee = getEmployeeById(id);
        employeeRepository.delete(employee);
    }


    @Transactional(readOnly = true)
    public Page<Employee> searchEmployees(
            String keyword,
            Pageable pageable
    ) {
        if (keyword == null || keyword.isBlank()) {
            throw new IllegalArgumentException(
                    "Search keyword must not be empty"
            );
        }

        return employeeRepository.searchEmployees(
                keyword.trim(),
                pageable
        );
    }
}
