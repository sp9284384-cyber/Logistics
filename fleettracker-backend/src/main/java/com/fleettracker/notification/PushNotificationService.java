package com.fleettracker.notification;

import java.util.List;

import com.fleettracker.order.Order;
import com.fleettracker.user.User;
import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PushNotificationService {

    private static final Logger log = LoggerFactory.getLogger(PushNotificationService.class);

    private final DeviceTokenRepository deviceTokenRepository;

    public void sendNewOrderAssigned(User driver, Order order) {
        sendToDriver(driver.getId(), "New order assigned",
            "Order " + order.getReferenceNumber() + " has been assigned to you");
    }

    public void sendToDriver(Long driverId, String title, String body) {
        if (FirebaseApp.getApps().isEmpty()) {
            log.warn("Firebase not initialised - skipping push to driver {}", driverId);
            return;
        }

        List<DeviceToken> tokens = deviceTokenRepository.findAllByUserId(driverId);
        for (DeviceToken deviceToken : tokens) {
            Message message = Message.builder()
                .setToken(deviceToken.getToken())
                .setNotification(Notification.builder().setTitle(title).setBody(body).build())
                .build();
            try {
                FirebaseMessaging.getInstance().send(message);
            } catch (FirebaseMessagingException e) {
                String code = e.getMessagingErrorCode() != null
                    ? e.getMessagingErrorCode().name() : "";
                if ("UNREGISTERED".equals(code) || "INVALID_ARGUMENT".equals(code)) {
                    // Token is dead - drop it so we stop trying
                    deviceTokenRepository.delete(deviceToken);
                } else {
                    log.error("Failed to send push to driver {}: {}", driverId, e.getMessage());
                }
            }
        }
    }
}
