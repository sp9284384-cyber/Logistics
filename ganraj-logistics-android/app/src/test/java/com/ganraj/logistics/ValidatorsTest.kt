package com.ganraj.logistics

import com.ganraj.logistics.util.Validators
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ValidatorsTest {

    @Test
    fun `required rejects blank values`() {
        assertEquals("Pickup location is required", Validators.required("  ", "Pickup location"))
    }

    @Test
    fun `required accepts normal text`() {
        assertNull(Validators.required("Badlapur", "Pickup location"))
    }

    @Test
    fun `phone accepts plain 10 digit mobile`() {
        assertNull(Validators.phone("8108767159"))
    }

    @Test
    fun `phone accepts 91 prefix`() {
        assertNull(Validators.phone("+91 81087 67159"))
    }

    @Test
    fun `phone rejects short numbers`() {
        assertEquals("Enter a valid 10-digit mobile number", Validators.phone("12345"))
    }

    @Test
    fun `phone rejects empty input`() {
        assertEquals("Phone number is required", Validators.phone(""))
    }
}
