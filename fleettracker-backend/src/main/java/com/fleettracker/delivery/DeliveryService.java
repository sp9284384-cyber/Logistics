package com.fleettracker.delivery;

import java.time.Instant;
import java.util.function.BiConsumer;

import com.fleettracker.common.exception.NotFoundException;
import com.fleettracker.order.Order;
import com.fleettracker.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;

    @Transactional
    public void recordAssignment(Order order, User driver) {
        Delivery delivery = deliveryRepository.findByOrderId(order.getId())
            .orElseGet(() -> Delivery.builder().order(order).build());
        delivery.setDriver(driver);
        delivery.setAssignedAt(Instant.now());
        delivery.setPickedUpAt(null);
        delivery.setDeliveredAt(null);
        deliveryRepository.save(delivery);
    }

    @Transactional
    public void markPickedUp(Long orderId) {
        setTimestamp(orderId, Delivery::setPickedUpAt);
    }

    @Transactional
    public void markDelivered(Long orderId) {
        setTimestamp(orderId, Delivery::setDeliveredAt);
    }

    private void setTimestamp(Long orderId, BiConsumer<Delivery, Instant> setter) {
        Delivery delivery = deliveryRepository.findByOrderId(orderId)
            .orElseThrow(() -> new NotFoundException("Delivery not found for order " + orderId));
        setter.accept(delivery, Instant.now());
        deliveryRepository.save(delivery);
    }
}
