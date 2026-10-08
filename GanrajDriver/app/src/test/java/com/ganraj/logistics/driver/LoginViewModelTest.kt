package com.ganraj.logistics.driver

import com.ganraj.logistics.driver.core.network.ApiResult
import com.ganraj.logistics.driver.data.model.AuthResponse
import com.ganraj.logistics.driver.data.repository.AuthRepository
import com.ganraj.logistics.driver.ui.auth.LoginViewModel
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class LoginViewModelTest {

    @Before fun setUp() = Dispatchers.setMain(UnconfinedTestDispatcher())
    @After fun tearDown() = Dispatchers.resetMain()

    @Test fun blank_fields_show_an_error_and_do_not_call_the_server() {
        val repo = mockk<AuthRepository>()
        val vm = LoginViewModel(repo)
        vm.login("", "")
        assertEquals("Enter your email and password.", vm.state.value.error)
        coVerify(exactly = 0) { repo.login(any(), any()) }
    }

    @Test fun wrong_password_shows_the_server_message() {
        val repo = mockk<AuthRepository>()
        coEvery { repo.login("a@b.com", "bad") } returns ApiResult.Error("Invalid email or password.", 401)
        val vm = LoginViewModel(repo)
        vm.login("a@b.com", "bad")
        assertEquals("Invalid email or password.", vm.state.value.error)
        assertFalse(vm.state.value.isLoading)
    }

    @Test fun successful_login_clears_loading_and_error() {
        val repo = mockk<AuthRepository>()
        coEvery { repo.login("a@b.com", "good") } returns
            ApiResult.Success(AuthResponse("t", "DRIVER", 1, "Driver"))
        val vm = LoginViewModel(repo)
        vm.login("a@b.com", "good")
        assertNull(vm.state.value.error)
        assertFalse(vm.state.value.isLoading)
    }
}
