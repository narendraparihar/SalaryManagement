package salaryManagement.HRMS.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import salaryManagement.HRMS.dto.auth.AuthResponse;
import salaryManagement.HRMS.dto.auth.LoginRequest;
import salaryManagement.HRMS.dto.auth.SignupRequest;
import salaryManagement.HRMS.model.Users;
import salaryManagement.HRMS.repository.UsersRepository;
import salaryManagement.HRMS.service.JwtService;

import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UsersRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthController(
            UsersRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService){

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService=jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest request) {

        try {
            Authentication authentication =
                    authenticationManager.authenticate(
                            UsernamePasswordAuthenticationToken.unauthenticated(
                                    request.email().trim(),
                                    request.password()
                            )
                    );

            String token = jwtService.generateToken(authentication);

            Users user = userRepository
                    .findByEmailIgnoreCase(authentication.getName())
                    .orElseThrow();

            return ResponseEntity.ok(
                    Map.of(
                            "accessToken", token,
                            "tokenType", "Bearer",
                            "expiresIn", 900,
                            "userId", user.getId().toString(),
                            "email", user.getEmail()
                    )
            );

        } catch (AuthenticationException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "error", "Invalid email or password"
                    ));
        }
    }
    @PostMapping("/signup")
    public ResponseEntity<?> signup(
            @Valid @RequestBody SignupRequest request) {

        String email = request.email()
                .trim()
                .toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmailIgnoreCase(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Email is already registered"));
        }

        Users user = new Users();
        user.setEmail(email);
        user.setPasswordHash(
                passwordEncoder.encode(request.password())
        );
        user.setActive(true);

        try {
            Users savedUser = userRepository.saveAndFlush(user);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new AuthResponse(
                            savedUser.getId(),
                            savedUser.getEmail(),
                            "Signup successful"
                    ));
        } catch (DataIntegrityViolationException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Email is already registered"));
        }
    }
}