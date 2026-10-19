package salaryManagement.HRMS.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import salaryManagement.HRMS.dto.CreateUserRequest;
import salaryManagement.HRMS.dto.UpdateUserRequest;
import salaryManagement.HRMS.dto.UserResponse;
import salaryManagement.HRMS.model.Users;
import salaryManagement.HRMS.repository.UsersRepository;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    private final UsersRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(
            UsersRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public UserResponse createUser(CreateUserRequest request) {
        String email = normalizeEmail(request.email());

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException(
                    "A user with this email already exists"
            );
        }

        boolean hasProvider =
                hasText(request.identityProvider());

        boolean hasSubject =
                hasText(request.identitySubject());

        if (hasProvider != hasSubject) {
            throw new IllegalArgumentException(
                    "identityProvider and identitySubject must be supplied together"
            );
        }

        if (!hasText(request.password()) && !hasProvider) {
            throw new IllegalArgumentException(
                    "A password is required for password-based accounts"
            );
        }

        Users user = new Users();
        user.setEmail(email);

        if (hasText(request.password())) {
            user.setPasswordHash(
                    passwordEncoder.encode(request.password())
            );
        }

        user.setIdentityProvider(request.identityProvider());
        user.setIdentitySubject(request.identitySubject());

        user.setActive(
                request.isActive() == null || request.isActive()
        );

        try {
            return toResponse(userRepository.save(user));
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException(
                    "Email or external identity already exists"
            );
        }
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(UUID id) {
        return toResponse(findUser(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public UserResponse updateUser(
            UUID id,
            UpdateUserRequest request
    ) {
        Users user = findUser(id);

        if (request.email() != null) {
            if (request.email().isBlank()) {
                throw new IllegalArgumentException(
                        "Email cannot be blank"
                );
            }

            String email = normalizeEmail(request.email());

            userRepository.findByEmailIgnoreCase(email)
                    .filter(existing -> !existing.getId().equals(id))
                    .ifPresent(existing -> {
                        throw new IllegalArgumentException(
                                "A user with this email already exists"
                        );
                    });

            user.setEmail(email);
        }

        if (request.password() != null) {
            if (request.password().isBlank()) {
                throw new IllegalArgumentException(
                        "Password cannot be blank"
                );
            }

            user.setPasswordHash(
                    passwordEncoder.encode(request.password())
            );
        }

        String provider = request.identityProvider() != null
                ? request.identityProvider()
                : user.getIdentityProvider();

        String subject = request.identitySubject() != null
                ? request.identitySubject()
                : user.getIdentitySubject();

        if (hasText(provider) != hasText(subject)) {
            throw new IllegalArgumentException(
                    "identityProvider and identitySubject must be supplied together"
            );
        }

        if (hasText(provider)) {
            userRepository
                    .findByIdentityProviderAndIdentitySubject(
                            provider, subject
                    )
                    .filter(existing -> !existing.getId().equals(id))
                    .ifPresent(existing -> {
                        throw new IllegalArgumentException(
                                "External identity is already associated with another user"
                        );
                    });
        }

        user.setIdentityProvider(provider);
        user.setIdentitySubject(subject);

        if (request.isActive() != null) {
            user.setActive(request.isActive());
        }

        try {
            return toResponse(userRepository.save(user));
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalArgumentException(
                    "Email or external identity already exists"
            );
        }
    }

    @Override
    public void deactivateUser(UUID id) {
        Users user = findUser(id);
        user.setActive(false);
        userRepository.save(user);
    }

    private Users findUser(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException(String.valueOf(id)));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private UserResponse toResponse(Users user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getIdentityProvider(),
                user.getIdentitySubject(),
                user.isActive(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}