package salaryManagement.HRMS.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import salaryManagement.HRMS.model.Users;

import java.util.Optional;
import java.util.UUID;

public interface UsersRepository extends JpaRepository<Users, UUID> {

    Optional<Users> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    Optional<Users> findByIdentityProviderAndIdentitySubject(
            String identityProvider,
            String identitySubject
    );

    boolean existsByIdentityProviderAndIdentitySubject(
            String identityProvider,
            String identitySubject
    );
}