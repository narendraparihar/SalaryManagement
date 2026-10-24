package salaryManagement.HRMS.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import salaryManagement.HRMS.model.Country;

import java.util.List;

public interface CountryRepository extends JpaRepository<Country, String> {

    @Query(value = """
        SELECT code, name, default_currency
        FROM countries
        """, nativeQuery = true)
    List<Country> findAllCountries();
}
