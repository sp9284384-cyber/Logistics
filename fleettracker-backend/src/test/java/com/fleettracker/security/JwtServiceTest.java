package com.fleettracker.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTest {

    private static final String SECRET = "0123456789abcdef0123456789abcdef";

    private final JwtService jwtService = new JwtService(SECRET, 3_600_000);

    @Test
    void generatesTokenWithSubjectAndRole() {
        String token = jwtService.generateToken(42L, "DRIVER");

        assertEquals("42", jwtService.extractUserId(token));
        assertEquals("DRIVER", jwtService.extractRole(token));
        assertTrue(jwtService.isValid(token));
    }

    @Test
    void rejectsTamperedToken() {
        String token = jwtService.generateToken(42L, "DRIVER");
        String tampered = token.substring(0, token.length() - 2) + "xx";

        assertFalse(jwtService.isValid(tampered));
    }

    @Test
    void rejectsGarbageToken() {
        assertFalse(jwtService.isValid("not.a.token"));
    }

    @Test
    void rejectsExpiredToken() {
        JwtService shortLived = new JwtService(SECRET, -1000);
        String token = shortLived.generateToken(1L, "DRIVER");

        assertFalse(shortLived.isValid(token));
    }
}
