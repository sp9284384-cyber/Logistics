package com.fleettracker.order;

import java.net.URI;

import com.fleettracker.common.dto.PageResponse;
import com.fleettracker.order.dto.AssignOrderRequest;
import com.fleettracker.order.dto.CreateOrderRequest;
import com.fleettracker.order.dto.OrderResponse;
import com.fleettracker.order.dto.UpdateStatusRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @PreAuthorize("hasRole('DISPATCHER')")
    public ResponseEntity<OrderResponse> create(@Valid @RequestBody CreateOrderRequest request,
                                                Authentication auth) {
        OrderResponse created = orderService.createOrder(request, Long.valueOf(auth.getName()));
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
            .path("/{id}").build(created.id());
        return ResponseEntity.created(location).body(created);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('DISPATCHER', 'DRIVER')")
    public PageResponse<OrderResponse> list(@RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {
        boolean isDriver = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_DRIVER"));
        return isDriver
            ? orderService.getOrdersForDriver(Long.valueOf(auth.getName()), status, page, size)
            : orderService.getOrders(status, page, size);
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasRole('DISPATCHER')")
    public OrderResponse assign(@PathVariable Long id,
                                @Valid @RequestBody AssignOrderRequest request) {
        return orderService.assignOrder(id, request);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('DRIVER')")
    public OrderResponse updateStatus(@PathVariable Long id,
                                      @Valid @RequestBody UpdateStatusRequest request,
                                      Authentication auth) {
        return orderService.updateStatus(id, Long.valueOf(auth.getName()), request);
    }
}
