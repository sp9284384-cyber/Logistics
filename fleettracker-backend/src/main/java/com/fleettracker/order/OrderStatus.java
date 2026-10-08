package com.fleettracker.order;

import java.util.Map;
import java.util.Set;

public enum OrderStatus {
    CREATED,
    ASSIGNED,
    PICKED_UP,
    IN_TRANSIT,
    DELIVERED,
    CANCELLED;

    private static final Map<OrderStatus, Set<OrderStatus>> TRANSITIONS = Map.of(
        CREATED, Set.of(ASSIGNED, CANCELLED),
        ASSIGNED, Set.of(PICKED_UP, CANCELLED),
        PICKED_UP, Set.of(IN_TRANSIT),
        IN_TRANSIT, Set.of(DELIVERED),
        DELIVERED, Set.of(),
        CANCELLED, Set.of()
    );

    public boolean canTransitionTo(OrderStatus next) {
        return next != null && TRANSITIONS.get(this).contains(next);
    }
}
