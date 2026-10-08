package com.fleettracker.config;

import java.io.FileInputStream;
import java.io.IOException;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FirebaseConfig {

    @Bean
    @ConditionalOnProperty(name = "firebase.enabled", havingValue = "true")
    public FirebaseApp firebaseApp(
            @Value("${firebase.credentials-path:}") String credentialsPath) throws IOException {
        GoogleCredentials credentials;
        if (credentialsPath != null && !credentialsPath.isBlank()) {
            credentials = GoogleCredentials.fromStream(new FileInputStream(credentialsPath));
        } else {
            credentials = GoogleCredentials.getApplicationDefault();
        }
        FirebaseOptions options = FirebaseOptions.builder()
            .setCredentials(credentials)
            .build();
        return FirebaseApp.initializeApp(options);
    }
}
