package com.ganraj.logistics.driver

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import com.ganraj.logistics.driver.ui.auth.LoginScreen
import com.ganraj.logistics.driver.ui.theme.GanrajDriverTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class LoginScreenTest {
    @get:Rule val composeRule = createComposeRule()

    @Test fun typing_credentials_and_tapping_login_calls_the_callback() {
        var captured: Pair<String, String>? = null
        composeRule.setContent {
            GanrajDriverTheme { LoginScreen(onLoginClick = { e, p -> captured = e to p }) }
        }
        composeRule.onNodeWithText("Email").performTextInput("driver@ganraj.demo")
        composeRule.onNodeWithText("Password").performTextInput("Driver@123")
        composeRule.onNodeWithText("LOGIN").performClick()
        assertEquals("driver@ganraj.demo" to "Driver@123", captured)
    }
}
