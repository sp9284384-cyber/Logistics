# Booking lifecycle — do not reorder; history rows reference these by name
STATUSES = [
    "New",
    "Quoted",
    "Vehicle Assigned",
    "In Transit",
    "Delivered",
    "Cancelled",
]

VALID_TRANSITIONS: dict[str, list[str]] = {
    "New": ["Quoted", "Cancelled"],
    "Quoted": ["Vehicle Assigned", "Cancelled"],
    "Vehicle Assigned": ["In Transit", "Cancelled"],
    "In Transit": ["Delivered"],
    "Delivered": [],
    "Cancelled": [],
}
