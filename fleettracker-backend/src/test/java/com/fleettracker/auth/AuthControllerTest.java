package com.fleettracker.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fleettracker.auth.dto.AuthResponse;
import com.fleettracker.auth.dto.LoginRequest;
import com.fleettracker.common.exception.GlobalExceptionHandler;
import com.fleettracker.config.SecurityConfig;
import com.fleettracker.security.CustomUserDetailsService;
import com.fleettracker.security.JwtAuthFilter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class})
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private JwtAuthFilter jwtAuthFilter;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    void goodLoginReturnsToken() throws Exception {
        when(authService.login(any())).thenReturn(new AuthResponse("test-token", "DISPATCHER", "Priya"));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    new LoginRequest("admin@fleet.local", "secret123"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").value("test-token"))
            .andExpect(jsonPath("$.role").value("DISPATCHER"))
            .andExpect(jsonPath("$.name").value("Priya"));
    }

    @Test
    void wrongPasswordReturns401() throws Exception {
        when(authService.login(any())).thenThrow(new BadCredentialsException("Invalid email or password"));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    new LoginRequest("admin@fleet.local", "wrong"))))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpointWithoutTokenIsRejected() throws Exception {
        mockMvc.perform(get("/api/orders"))
            .andExpect(status().isForbidden());
    }
}
