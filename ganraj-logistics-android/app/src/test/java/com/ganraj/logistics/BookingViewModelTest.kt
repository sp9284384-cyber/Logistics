package com.ganraj.logistics

import com.ganraj.logistics.data.repository.BookingRepository
import com.ganraj.logistics.ui.booking.BookingFormState
import com.ganraj.logistics.ui.booking.BookingViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class BookingViewModelTest {

    private val dispatcher = UnconfinedTestDispatcher()

    @Before
    fun setUp() { Dispatchers.setMain(dispatcher) }

    @After
    fun tearDown() { Dispatchers.resetMain() }

    private fun viewModel() = BookingViewModel(BookingRepository(FakeApiService()))

    @Test
    fun `valid form passes validation`() {
        val vm = viewModel()
        vm.update("pickup", "Badlapur")
        vm.update("delivery", "Pune")
        vm.update("material", "Plastic")
        vm.update("quantity", "5 tonnes")
        vm.update("name", "Test Customer")
        vm.update("phone", "8108767159")
        assertTrue(vm.validate().isEmpty())
    }

    @Test
    fun `missing phone reports phone error`() {
        val vm = viewModel()
        val errors = vm.validate(
            BookingFormState(
                pickupLocation = "Badlapur", deliveryLocation = "Pune",
                material = "Plastic", quantity = "5 tonnes",
                customerName = "Test"
            )
        )
        assertEquals("Phone number is required", errors["phone"])
    }

    @Test
    fun `editing a field clears its error`() {
        val vm = viewModel()
        vm.update("phone", "123")
        vm.submit { }                      // validation fails, error set
        assertTrue(vm.form.errors.containsKey("phone"))
        vm.update("phone", "8108767159")   // user corrects the field
        assertNull(vm.form.errors["phone"])
    }
}
