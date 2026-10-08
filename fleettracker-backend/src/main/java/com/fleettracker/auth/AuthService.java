package com.fleettracker.auth;

import com.fleettracker.auth.dto.AuthResponse;
import com.fleettracker.auth.dto.LoginRequest;
import com.fleettracker.common.exception.NotFoundException;
import com.fleettracker.security.JwtService;
import com.fleettracker.user.User;
import com.fleettracker.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));
        } catch (BadCredentialsException e) {
            throw new BadCredentialsException("Invalid email or password");
        }

        User user = userRepository.findByEmail(request.email())
            .orElseThrow(() -> new NotFoundException("User not found"));
        String token = jwtService.generateToken(user.getId(), user.getRole().name());
        return new AuthResponse(token, user.getRole().name(), user.getName());
    }
}
