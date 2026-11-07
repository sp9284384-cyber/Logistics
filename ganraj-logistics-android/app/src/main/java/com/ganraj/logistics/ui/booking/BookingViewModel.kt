package com.ganraj.logistics.ui.booking

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ganraj.logistics.data.remote.dto.BookingRequestDto
import com.ganraj.logistics.data.repository.AppResult
import com.ganraj.logistics.data.repository.BookingRepository
import com.ganraj.logistics.util.Constants
import com.ganraj.logistics.util.Validators
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.launch

data class BookingFormState(
    val pickupLocation: String = "",
    val deliveryLocation: String = "",
    val material: String = "",
    val quantity: String = "",
    val vehicleType: String = Constants.VEHICLE_TYPES.last(),
    val pickupDate: String = "",          // ISO "yyyy-MM-dd"
    val customerName: String = "",
    val phone: String = "",
    val errors: Map<String, String> = emptyMap(),
    val submitting: Boolean = false,
    val submitError: String? = null
)

@HiltViewModel
class BookingViewModel @Inject constructor(
    private val bookingRepository: BookingRepository
) : ViewModel() {

    var form by mutableStateOf(BookingFormState())
        private set

    fun update(field: String, value: String) {
        form = when (field) {
            "pickup" -> form.copy(pickupLocation = value)
            "delivery" -> form.copy(deliveryLocation = value)
            "material" -> form.copy(material = value)
            "quantity" -> form.copy(quantity = value)
            "vehicle" -> form.copy(vehicleType = value)
            "date" -> form.copy(pickupDate = value)
            "name" -> form.copy(customerName = value)
            "phone" -> form.copy(phone = value)
            else -> form
        }
        // Clear the error for the field being corrected.
        if (form.errors.containsKey(field)) {
            form = form.copy(errors = form.errors - field)
        }
    }

    fun submit(onSuccess: (reference: String) -> Unit) {
        val errors = validate()
        if (errors.isNotEmpty()) {
            form = form.copy(errors = errors, submitError = null)
            return
        }
        form = form.copy(submitting = true, submitError = null)
        viewModelScope.launch {
            val request = BookingRequestDto(
                pickupLocation = form.pickupLocation.trim(),
                deliveryLocation = form.deliveryLocation.trim(),
                material = form.material.trim(),
                quantity = form.quantity.trim(),
                vehicleType = form.vehicleType,
                pickupDate = form.pickupDate.ifBlank { null },
                customerName = form.customerName.trim(),
                phone = form.phone.trim()
            )
            when (val result = bookingRepository.submit(request)) {
                is AppResult.Success -> {
                    form = form.copy(submitting = false)
                    onSuccess(result.data.reference)
                }
                is AppResult.ValidationError -> {
                    form = form.copy(submitting = false, errors = result.fieldErrors)
                }
                is AppResult.RateLimited -> {
                    form = form.copy(submitting = false, submitError = result.message)
                }
                is AppResult.AuthError, is AppResult.NetworkError -> {
                    form = form.copy(submitting = false, submitError = result.let { (it as? AppResult.RateLimited)?.message ?: "Could not submit. Please try again." })
                }
            }
        }
    }

    /** Local validation for a better UX; the backend schema is the real protection. */
    internal fun validate(state: BookingFormState = form): Map<String, String> {
        val errors = mutableMapOf<String, String>()
        Validators.required(state.pickupLocation, "Pickup location")?.let { errors["pickup"] = it }
        Validators.required(state.deliveryLocation, "Delivery location")?.let { errors["delivery"] = it }
        Validators.required(state.material, "Material")?.let { errors["material"] = it }
        Validators.required(state.quantity, "Quantity")?.let { errors["quantity"] = it }
        Validators.required(state.customerName, "Your name")?.let { errors["name"] = it }
        Validators.phone(state.phone)?.let { errors["phone"] = it }
        return errors
    }
}
