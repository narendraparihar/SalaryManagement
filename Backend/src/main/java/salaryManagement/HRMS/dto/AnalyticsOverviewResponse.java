
package salaryManagement.HRMS.dto;

import salaryManagement.HRMS.repository.projection.OverviewSalaryProjection;
import java.util.List;

public record AnalyticsOverviewResponse(
        long activeHeadcount,
        List<OverviewSalaryProjection> salarySummaries
) {}
