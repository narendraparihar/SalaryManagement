
package salaryManagement.HRMS.service;

import salaryManagement.HRMS.dto.QuestionAnswerResponse;
import salaryManagement.HRMS.dto.QuestionAnswerResponse.QuestionFilters;
import salaryManagement.HRMS.dto.QuestionMetric;
import salaryManagement.HRMS.dto.QuestionRequest;
import salaryManagement.HRMS.repository.QuestionRepository;
import salaryManagement.HRMS.repository.projection.QuestionAggregateProjection;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class QuestionAnswerService {

    private final QuestionRepository questionRepository;

    public QuestionAnswerService(
            QuestionRepository questionRepository) {
        this.questionRepository = questionRepository;
    }

    public QuestionAnswerResponse answer(QuestionRequest request) {

        String question = request.question().trim();
        String normalized = question.toLowerCase(Locale.ROOT);

        LocalDate asOfDate = request.asOfDate() != null
                ? request.asOfDate()
                : LocalDate.now();

        // Supported country for the first version.
        boolean indiaQuestion =
                normalized.matches("(?s).*\\bindia\\b.*")
                        || normalized.matches("(?s).*\\bindian\\b.*");

        if (!indiaQuestion) {
            return unsupported(
                    question,
                    "Currently, compensation questions about India are supported."
            );
        }

        QuestionMetric metric = detectMetric(normalized);

        if (metric == null) {
            return unsupported(
                    question,
                    "Supported metrics are average, total, minimum, "
                            + "maximum annual salary, and employee count."
            );
        }

        QuestionAggregateProjection aggregate =
                questionRepository.getSalaryAggregate(
                        "IN",
                        "INR",
                        asOfDate
                );

        BigDecimal value = switch (metric) {
            case AVERAGE -> aggregate.getAverageSalary();
            case TOTAL -> aggregate.getTotalSalary();
            case MINIMUM -> aggregate.getMinimumSalary();
            case MAXIMUM -> aggregate.getMaximumSalary();
            case EMPLOYEE_COUNT ->
                    aggregate.getEmployeeCount() == null
                            ? BigDecimal.ZERO
                            : BigDecimal.valueOf(
                            aggregate.getEmployeeCount()
                    );
        };

        long employeeCount = aggregate.getEmployeeCount() == null
                ? 0L
                : aggregate.getEmployeeCount();

        return new QuestionAnswerResponse(
                question,
                "answered",
                toMetricName(metric),
                new QuestionFilters("IN", asOfDate.toString()),
                "INR",
                value,
                employeeCount,
                explanation(metric)
        );
    }

    private QuestionMetric detectMetric(String question) {

        if (question.matches(
                "(?s).*(how many employees|employee count|"
                        + "number of employees|headcount).*")) {
            return QuestionMetric.EMPLOYEE_COUNT;
        }

        if (question.matches(
                "(?s).*(average|avg|mean).*")) {
            return QuestionMetric.AVERAGE;
        }

        if (question.matches(
                "(?s).*(total|sum|aggregate).*")) {
            return QuestionMetric.TOTAL;
        }

        if (question.matches(
                "(?s).*(minimum|min|lowest).*")) {
            return QuestionMetric.MINIMUM;
        }

        if (question.matches(
                "(?s).*(maximum|max|highest).*")) {
            return QuestionMetric.MAXIMUM;
        }

        return null;
    }

    private String toMetricName(QuestionMetric metric) {
        return switch (metric) {
            case AVERAGE -> "average_annual_base_salary";
            case TOTAL -> "total_annual_base_salary";
            case MINIMUM -> "minimum_annual_base_salary";
            case MAXIMUM -> "maximum_annual_base_salary";
            case EMPLOYEE_COUNT -> "employee_count";
        };
    }

    private String explanation(QuestionMetric metric) {
        return switch (metric) {
            case AVERAGE ->
                    "Average annual base salary for employees with a salary "
                            + "effective on the specified date.";
            case TOTAL ->
                    "Total annual base salary for employees with a salary "
                            + "effective on the specified date.";
            case MINIMUM ->
                    "Minimum annual base salary for employees with a salary "
                            + "effective on the specified date.";
            case MAXIMUM ->
                    "Maximum annual base salary for employees with a salary "
                            + "effective on the specified date.";
            case EMPLOYEE_COUNT ->
                    "Number of active employees with a salary effective "
                            + "on the specified date.";
        };
    }

    private QuestionAnswerResponse unsupported(
            String question,
            String explanation) {

        return new QuestionAnswerResponse(
                question,
                "unsupported",
                null,
                null,
                null,
                null,
                null,
                explanation
        );
    }
}
