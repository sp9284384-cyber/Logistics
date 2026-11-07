package com.ganraj.logistics

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.ganraj.logistics.data.repository.BookingRepository
import com.ganraj.logistics.ui.booking.BookingScreen
import com.ganraj.logistics.ui.theme.GanrajTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class BookingFlowTest {

    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun fillFormAndSubmit_showsSuccess() {
        var reference = ""
        composeRule.setContent {
            GanrajTheme {
                BookingScreen(
                    onBack = {},
                    onSuccess = { reference = it },
                    viewModel = com.ganraj.logistics.ui.booking.BookingViewModel(
                        BookingRepository(FakeApiService())
                    )
                )
            }
        }

        composeRule.onNodeWithText("Pickup Location *").performTextInput("Badlapur")
        composeRule.onNodeWithText("Delivery Location *").performTextInput("Pune")
        composeRule.onNodeWithText("Material *").performTextInput("Plastic")
        composeRule.onNodeWithText("Quantity *").performTextInput("5 tonnes")
        composeRule.onNodeWithText("Your Name *").performTextInput("Test Customer")
        composeRule.onNodeWithText("Phone Number *").performTextInput("8108767159")
        composeRule.onNodeWithText("Submit Booking Request", substring = true).performClick()

        composeRule.waitForIdle()
        assert(reference == "GLS-2026-00042")
    }
}
