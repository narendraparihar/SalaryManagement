
package salaryManagement.HRMS.controller;

import salaryManagement.HRMS.dto.QuestionAnswerResponse;
import salaryManagement.HRMS.dto.QuestionRequest;
import salaryManagement.HRMS.model.Employee;
import salaryManagement.HRMS.service.QuestionAnswerService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/v1/questions")
public class QuestionController {

    private final QuestionAnswerService questionAnswerService;

    public QuestionController(
            QuestionAnswerService questionAnswerService) {
        this.questionAnswerService = questionAnswerService;
    }

    @PostMapping
    public QuestionAnswerResponse answerQuestion(
            @Valid @RequestBody QuestionRequest request) {

        return questionAnswerService.answer(request);
    }

}
