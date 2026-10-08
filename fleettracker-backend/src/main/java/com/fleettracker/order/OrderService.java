package com.fleettracker.order;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import com.fleettracker.common.dto.PageResponse;
import com.fleettracker.common.exception.InvalidStateException;
import com.fleettracker.common.exception.NotFoundException;
import com.fleettracker.delivery.DeliveryService;
import com.fleettracker.notification.PushNotificationService;
import com.fleettracker.order.dto.AssignOrderRequest;
import com.fleettracker.order.dto.CreateOrderRequest;
import com.fleettracker.order.dto.OrderResponse;
import com.fleettracker.order.dto.UpdateStatusRequest;
import com.fleettracker.user.Role;
import com.fleettracker.user.User;
import com.fleettracker.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OrderService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final DeliveryService deliveryService;
    private final PushNotificationService pushNotificationService;

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request, Long dispatcherId) {
        User dispatcher = userRepository.findById(dispatcherId)
            .orElseThrow(() -> new NotFoundException("Dispatcher not found: " + dispatcherId));

        Order order = Order.builder()
            .referenceNumber(generateReference())
            .pickupAddress(request.pickupAddress())
            .pickupLat(request.pickupLat())
            .pickupLng(request.pickupLng())
            .dropAddress(request.dropAddress())
            .dropLat(request.dropLat())
            .dropLng(request.dropLng())
            .customerName(request.customerName())
            .customerPhone(request.customerPhone())
            .itemDescription(request.itemDescription())
            .status(OrderStatus.CREATED)
            .createdBy(dispatcher)
            .build();

        return OrderResponse.from(orderRepository.save(order));
    }

    @Transactional
    public OrderResponse assignOrder(Long orderId, AssignOrderRequest request) {
        Order order = findOrder(orderId);
        if (order.getStatus() != OrderStatus.CREATED && order.getStatus() != OrderStatus.ASSIGNED) {
            throw new InvalidStateException(
                "Order " + orderId + " cannot be assigned while in status " + order.getStatus());
        }

        User driver = userRepository.findById(request.driverId())
            .filter(u -> u.getRole() == Role.DRIVER && u.isActive())
            .orElseThrow(() -> new NotFoundException("Active driver not found: " + request.driverId()));

        order.setAssignedDriver(driver);
        order.setStatus(OrderStatus.ASSIGNED);
        deliveryService.recordAssignment(order, driver);
        pushNotificationService.sendNewOrderAssigned(driver, order);

        return OrderResponse.from(orderRepository.save(order));
    }

    @Transactional
    public OrderResponse updateStatus(Long orderId, Long driverId, UpdateStatusRequest request) {
        Order order = findOrder(orderId);

        // Ownership is enforced in the service layer, not just by role
        if (order.getAssignedDriver() == null
            || !order.getAssignedDriver().getId().equals(driverId)) {
            throw new AccessDeniedException("You can only update your own orders");
        }

        OrderStatus next = request.status();
        if (!order.getStatus().canTransitionTo(next)) {
            throw new InvalidStateException(
                "Cannot move order from " + order.getStatus() + " to " + next);
        }

        order.setStatus(next);
        if (next == OrderStatus.PICKED_UP) {
            deliveryService.markPickedUp(orderId);
        } else if (next == OrderStatus.DELIVERED) {
            deliveryService.markDelivered(orderId);
        }

        return OrderResponse.from(orderRepository.save(order));
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getOrders(OrderStatus status, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Order> result = status == null
            ? orderRepository.findAll(pageable)
            : orderRepository.findByStatus(status, pageable);
        return PageResponse.from(result.map(OrderResponse::from));
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getOrdersForDriver(Long driverId, OrderStatus status,
                                                          int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Order> result = status == null
            ? orderRepository.findByAssignedDriverId(driverId, pageable)
            : orderRepository.findByAssignedDriverIdAndStatus(driverId, status, pageable);
        return PageResponse.from(result.map(OrderResponse::from));
    }

    public Order findOrder(Long id) {
        return orderRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Order not found: " + id));
    }

    private String generateReference() {
        String date = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        return "ORD-" + date + "-" + (1000 + RANDOM.nextInt(9000));
    }
}
