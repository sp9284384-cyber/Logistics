package com.fleettracker.order;

import java.util.Optional;

import com.fleettracker.common.exception.InvalidStateException;
import com.fleettracker.delivery.DeliveryService;
import com.fleettracker.notification.PushNotificationService;
import com.fleettracker.order.dto.OrderResponse;
import com.fleettracker.order.dto.UpdateStatusRequest;
import com.fleettracker.user.Role;
import com.fleettracker.user.User;
import com.fleettracker.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private DeliveryService deliveryService;

    @Mock
    private PushNotificationService pushNotificationService;

    @InjectMocks
    private OrderService orderService;

    private User driver;
    private Order order;

    @BeforeEach
    void setUp() {
        driver = User.builder().id(2L).name("Ram").role(Role.DRIVER).active(true).build();
        User dispatcher = User.builder().id(1L).role(Role.DISPATCHER).active(true).build();
        order = Order.builder()
            .id(10L)
            .referenceNumber("ORD-20261008-1000")
            .pickupAddress("Mumbai").pickupLat(19.0).pickupLng(72.0)
            .dropAddress("Delhi").dropLat(28.0).dropLng(77.0)
            .customerName("Acme Traders")
            .status(OrderStatus.ASSIGNED)
            .createdBy(dispatcher)
            .assignedDriver(driver)
            .build();

        lenient().when(orderRepository.findById(10L)).thenReturn(Optional.of(order));
        lenient().when(orderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void validTransitionAssignToPickedUp() {
        OrderResponse result = orderService.updateStatus(10L, 2L,
            new UpdateStatusRequest(OrderStatus.PICKED_UP));

        assertEquals(OrderStatus.PICKED_UP, result.status());
        verify(deliveryService).markPickedUp(10L);
    }

    @Test
    void invalidTransitionIsRejected() {
        assertThrows(InvalidStateException.class, () ->
            orderService.updateStatus(10L, 2L, new UpdateStatusRequest(OrderStatus.DELIVERED)));

        verify(orderRepository, never()).save(any());
    }

    @Test
    void deliveredIsFinal() {
        order.setStatus(OrderStatus.DELIVERED);

        assertThrows(InvalidStateException.class, () ->
            orderService.updateStatus(10L, 2L, new UpdateStatusRequest(OrderStatus.IN_TRANSIT)));
    }

    @Test
    void driverCannotTouchAnotherDriversOrder() {
        assertThrows(AccessDeniedException.class, () ->
            orderService.updateStatus(10L, 99L, new UpdateStatusRequest(OrderStatus.PICKED_UP)));

        verify(orderRepository, never()).save(any());
    }

    @Test
    void unassignedOrderCannotBeAdvancedByDriver() {
        order.setAssignedDriver(null);

        assertThrows(AccessDeniedException.class, () ->
            orderService.updateStatus(10L, 2L, new UpdateStatusRequest(OrderStatus.PICKED_UP)));
    }
}
