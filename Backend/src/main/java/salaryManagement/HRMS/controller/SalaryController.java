
package salaryManagement.HRMS.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import salaryManagement.HRMS.dto.SalaryCreateRequest;
import salaryManagement.HRMS.dto.SalaryPatchRequest;
import salaryManagement.HRMS.dto.SalaryResponse;
import salaryManagement.HRMS.service.SalaryService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class SalaryController {

    private final SalaryService salaryService;

    public SalaryController(SalaryService salaryService) {
        this.salaryService = salaryService;
    }

    // POST /employees/{id}/salaries
    @PostMapping("/employees/{id}/salaries")
    @ResponseStatus(HttpStatus.CREATED)
    public SalaryResponse createSalary(
            @PathVariable("id") UUID employeeId,
            @Valid @RequestBody SalaryCreateRequest request) {

        return salaryService.createSalary(employeeId, request);
    }

    // GET /employees/{id}/salaries
    @GetMapping("/employees/{id}/salaries")
    public List<SalaryResponse> getSalaryHistory(
            @PathVariable("id") UUID employeeId) {

        return salaryService.getSalaryHistory(employeeId);
    }

    // GET /salaries/{id}
    @GetMapping("/salaries/{id}")
    public SalaryResponse getSalaryById(
            @PathVariable UUID id) {

        return salaryService.getSalaryById(id);
    }

    // PATCH /salaries/{id}
    @PatchMapping("/salaries/{id}")
    public SalaryResponse updateSalary(
            @PathVariable UUID id,
            @Valid @RequestBody SalaryPatchRequest request) {

        return salaryService.updateSalary(id, request);
    }

    // GET /salaries/current
    @GetMapping("/salaries/current")
    public Page<SalaryResponse> getCurrentSalaries(
            @PageableDefault(size = 20, page = 0)
            Pageable pageable
    ) {
        return salaryService.getCurrentSalaries(pageable);
    }

    @GetMapping("/salaries/search")
    public Page<SalaryResponse> searchSalaries(
            @RequestParam String keyword,
            @PageableDefault(size = 20, page = 0)
            Pageable pageable
    ) {
        return salaryService.searchSalaries(keyword, pageable);
    }
}
