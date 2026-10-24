package salaryManagement.HRMS.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "countries", schema = "hrms")
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Getter
@Setter
public class Country {

    @jakarta.persistence.Id
    private String code;

    private String name;

    @Column(name = "default_currency", length = 3, nullable = false)
    private String defaultCurrency;

//    @Column(name = "created_at", nullable = false, updatable = false)
//    private LocalDate createdAt;

}
