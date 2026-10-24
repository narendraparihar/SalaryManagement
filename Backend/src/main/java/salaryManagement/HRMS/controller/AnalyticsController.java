
package salaryManagement.HRMS.controller;

import salaryManagement.HRMS.dto.AnalyticsOverviewResponse;
import salaryManagement.HRMS.repository.projection.*;
import salaryManagement.HRMS.service.AnalyticsService;
import salaryManagement.HRMS.service.SalaryCsvExportService;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("api/v1/analytics")
@Validated
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final SalaryCsvExportService csvExportService;

    public AnalyticsController(
            AnalyticsService analyticsService,
            SalaryCsvExportService csvExportService) {
        this.analyticsService = analyticsService;
        this.csvExportService = csvExportService;
    }

    // GET /analytics/overview
    @GetMapping("/overview")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'HR_ANALYST')")
    public AnalyticsOverviewResponse getOverview(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate asOf) {

        return analyticsService.getOverview(asOf);
    }
    // GET /analytics/salaries/by-country
    @GetMapping("/salaries/by-country")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'HR_ANALYST')")
    public List<CountrySalaryProjection> getSalaryByCountry(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate asOf,

            @RequestParam(required = false)
            String countryCode,

            @RequestParam(required = false)
            String currencyCode) {

        return analyticsService.getByCountry(
                asOf, countryCode, currencyCode
        );
    }

    // GET /analytics/salaries/by-department
    @GetMapping("/salaries/by-department")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'HR_ANALYST')")
    public List<DepartmentSalaryProjection> getSalaryByDepartment(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate asOf,

            @RequestParam(required = false)
            Long departmentId,

            @RequestParam(required = false)
            String currencyCode) {

        return analyticsService.getByDepartment(
                asOf, departmentId, currencyCode
        );
    }

    // GET /analytics/salaries/distribution
    @GetMapping("/salaries/distribution")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'HR_ANALYST')")
    public List<SalaryDistributionProjection> getSalaryDistribution(
            @RequestParam
            String currencyCode,

            @RequestParam(required = false)
            String countryCode,

            @RequestParam(required = false)
            Long departmentId,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate asOf) {

        return analyticsService.getDistribution(
                asOf, currencyCode, countryCode, departmentId
        );
    }

    // GET /analytics/highest-paid
    @GetMapping("/highest-paid")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'HR_ANALYST')")
    public List<HighestPaidProjection> getHighestPaid(
            @RequestParam(defaultValue = "10")
            @Min(1) @Max(500) int limit,

            @RequestParam(required = false)
            String countryCode,

            @RequestParam(required = false)
            Long departmentId,

            @RequestParam(required = false)
            String currencyCode,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate asOf) {

        return analyticsService.getHighestPaid(
                asOf, countryCode, departmentId, currencyCode, limit
        );
    }

    // GET /analytics/salaries/export
    @GetMapping(
            value = "/salaries/export",
            produces = "text/csv"
    )
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<byte[]> exportSalaries(
            @RequestParam(required = false)
            String countryCode,

            @RequestParam(required = false)
            Long departmentId,

            @RequestParam(required = false)
            String currencyCode,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate asOf,

            @RequestParam(defaultValue = "10000")
            @Min(1) @Max(10000) int maxRows) {

        List<SalaryExportProjection> rows =
                analyticsService.exportSalaries(
                        asOf, countryCode, departmentId, currencyCode, maxRows
                );

        byte[] content = csvExportService.toCsv(rows)
                .getBytes(StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv"))
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"salary-analytics.csv\""
                )
                .body(content);
    }
}
