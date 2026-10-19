
package salaryManagement.HRMS.service;

import salaryManagement.HRMS.dto.AnalyticsOverviewResponse;
import salaryManagement.HRMS.repository.AnalyticsRepository;
import salaryManagement.HRMS.repository.projection.*;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class AnalyticsService {

    private final AnalyticsRepository repository;

    public AnalyticsService(AnalyticsRepository repository) {
        this.repository = repository;
    }

    public AnalyticsOverviewResponse getOverview(LocalDate asOf) {
        LocalDate date = resolveDate(asOf);

        return new AnalyticsOverviewResponse(
                repository.countActiveEmployees(),
                repository.findOverviewSalaryStats(date)
        );
    }

    public List<CountrySalaryProjection> getByCountry(
            LocalDate asOf,
            String countryCode,
            String currencyCode) {

        return repository.findSalaryStatsByCountry(
                resolveDate(asOf),
                normalize(countryCode),
                normalize(currencyCode)
        );
    }

    public List<DepartmentSalaryProjection> getByDepartment(
            LocalDate asOf,
            Long departmentId,
            String currencyCode) {

        if (departmentId != null && departmentId <= 0) {
            throw new IllegalArgumentException(
                    "Department ID must be positive"
            );
        }

        return repository.findSalaryStatsByDepartment(
                resolveDate(asOf),
                departmentId,
                normalize(currencyCode)
        );
    }

    public List<SalaryDistributionProjection> getDistribution(
            LocalDate asOf,
            String currencyCode,
            String countryCode,
            Long departmentId) {

        String currency = normalize(currencyCode);

        if (currency == null || !currency.matches("[A-Z]{3}")) {
            throw new IllegalArgumentException(
                    "A valid three-letter currencyCode is required"
            );
        }

        if (departmentId != null && departmentId <= 0) {
            throw new IllegalArgumentException(
                    "Department ID must be positive"
            );
        }

        return repository.findSalaryDistribution(
                resolveDate(asOf),
                currency,
                normalize(countryCode),
                departmentId
        );
    }

    public List<HighestPaidProjection> getHighestPaid(
            LocalDate asOf,
            String countryCode,
            Long departmentId,
            String currencyCode,
            int limit) {

        if (limit < 1 || limit > 500) {
            throw new IllegalArgumentException(
                    "limit must be between 1 and 500"
            );
        }

        if (departmentId != null && departmentId <= 0) {
            throw new IllegalArgumentException(
                    "Department ID must be positive"
            );
        }

        return repository.findHighestPaidEmployees(
                resolveDate(asOf),
                normalize(countryCode),
                departmentId,
                normalize(currencyCode),
                limit
        );
    }

    public List<SalaryExportProjection> exportSalaries(
            LocalDate asOf,
            String countryCode,
            Long departmentId,
            String currencyCode,
            int maxRows) {

        if (maxRows < 1 || maxRows > 10000) {
            throw new IllegalArgumentException(
                    "maxRows must be between 1 and 10000"
            );
        }

        if (departmentId != null && departmentId <= 0) {
            throw new IllegalArgumentException(
                    "Department ID must be positive"
            );
        }

        return repository.findSalaryExportRows(
                resolveDate(asOf),
                normalize(countryCode),
                departmentId,
                normalize(currencyCode),
                maxRows
        );
    }

    private LocalDate resolveDate(LocalDate asOf) {
        return asOf != null ? asOf : LocalDate.now();
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim().toUpperCase(Locale.ROOT);
    }
}
