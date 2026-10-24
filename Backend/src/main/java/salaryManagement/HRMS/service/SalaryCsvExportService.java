
package salaryManagement.HRMS.service;

import salaryManagement.HRMS.repository.projection.SalaryExportProjection;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SalaryCsvExportService {

    public String toCsv(List<SalaryExportProjection> rows) {
        StringBuilder csv = new StringBuilder();

        csv.append(
                "employeeNumber,firstName,lastName,"
                        + "country,department,annualAmount,currencyCode,"
                        + "effectiveFrom,effectiveTo\n"
        );

        for (SalaryExportProjection row : rows) {
            appendRow(csv,
                    row.getEmployeeNumber(),
                    row.getFirstName(),
                    row.getLastName(),
                    row.getCountryName(),
                    row.getDepartmentName(),
                    row.getAnnualAmount(),
                    row.getCurrencyCode(),
                    row.getEffectiveFrom(),
                    row.getEffectiveTo()
            );
        }

        return csv.toString();
    }

    private void appendRow(StringBuilder csv, Object... values) {
        for (int i = 0; i < values.length; i++) {
            if (i > 0) {
                csv.append(',');
            }

            csv.append(escape(
                    values[i] == null ? "" : values[i].toString()
            ));
        }

        csv.append('\n');
    }

    private String escape(String value) {
        // Prevent spreadsheet formula execution from untrusted text.
        if (!value.isEmpty()
                && "=+-@".indexOf(value.charAt(0)) >= 0) {
            value = "'" + value;
        }

        return "\"" + value.replace("\"", "\"\"") + "\"";
    }
}
