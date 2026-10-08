package com.fleettracker.order;

import java.time.Instant;
import java.util.List;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fleettracker.common.dto.PageResponse;
import com.fleettracker.common.exception.GlobalExceptionHandler;
import com.fleettracker.config.SecurityConfig;
import com.fleettracker.order.dto.CreateOrderRequest;
import com.fleettracker.order.dto.OrderResponse;
import com.fleettracker.order.dto.UpdateStatusRequest;
import com.fleettracker.security.CustomUserDetailsService;
import com.fleettracker.security.JwtAuthFilter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(OrderController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class})
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private OrderService orderService;

    @MockitoBean
    private JwtAuthFilter jwtAuthFilter;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    private static final OrderResponse SAMPLE = new OrderResponse(
        1L, "ORD-20261008-1234",
        "Mumbai", 19.0760, 72.8777,
        "Delhi", 28.6139, 77.2090,
        "Acme Traders", "9876543210", "Electronics",
        OrderStatus.CREATED, 5L, null,
        Instant.now(), Instant.now());

    @Test
    void dispatcherCanCreateOrder() throws Exception {
        when(orderService.createOrder(any(), anyLong())).thenReturn(SAMPLE);

        CreateOrderRequest request = new CreateOrderRequest(
            "Mumbai", 19.0760, 72.8777,
            "Delhi", 28.6139, 77.2090,
            "Acme Traders", "9876543210", "Electronics");

        mockMvc.perform(post("/api/orders")
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_DISPATCHER")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.referenceNumber").value("ORD-20261008-1234"));
    }

    @Test
    void driverCannotCreateOrder() throws Exception {
        CreateOrderRequest request = new CreateOrderRequest(
            "Mumbai", 19.0760, 72.8777,
            "Delhi", 28.6139, 77.2090,
            "Acme Traders", "9876543210", "Electronics");

        mockMvc.perform(post("/api/orders")
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_DRIVER")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isForbidden());
    }

    @Test
    void driverCanUpdateOwnOrderStatus() throws Exception {
        when(orderService.updateStatus(eq(1L), anyLong(), any())).thenReturn(SAMPLE);

        mockMvc.perform(patch("/api/orders/1/status")
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_DRIVER")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    new UpdateStatusRequest(OrderStatus.PICKED_UP))))
            .andExpect(status().isOk());
    }

    @Test
    void dispatcherSeesAllOrdersButDriverSeesOnlyOwn() throws Exception {
        PageResponse<OrderResponse> page = new PageResponse<>(List.of(SAMPLE), 0, 20, 1);
        when(orderService.getOrders(isNull(), anyInt(), anyInt())).thenReturn(page);
        when(orderService.getOrdersForDriver(anyLong(), isNull(), anyInt(), anyInt())).thenReturn(page);

        mockMvc.perform(get("/api/orders?page=0&size=20")
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_DISPATCHER"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.total").value(1));

        verify(orderService).getOrders(isNull(), eq(0), eq(20));

        mockMvc.perform(get("/api/orders")
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_DRIVER"))))
            .andExpect(status().isOk());

        verify(orderService).getOrdersForDriver(anyLong(), isNull(), eq(0), eq(20));
    }
}
