package com.ganraj.logistics.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.ganraj.logistics.ui.about.AboutScreen
import com.ganraj.logistics.ui.admin.dashboard.DashboardScreen
import com.ganraj.logistics.ui.admin.detail.BookingDetailScreen
import com.ganraj.logistics.ui.admin.login.LoginScreen
import com.ganraj.logistics.ui.booking.BookingScreen
import com.ganraj.logistics.ui.booking.BookingSuccessScreen
import com.ganraj.logistics.ui.contact.ContactScreen
import com.ganraj.logistics.ui.home.HomeScreen
import com.ganraj.logistics.ui.services.ServicesScreen

@Composable
fun AppNavGraph(
    navController: NavHostController = rememberNavController(),
    startDestination: String = Routes.HOME
) {
    NavHost(navController = navController, startDestination = startDestination) {

        composable(Routes.HOME) {
            HomeScreen(
                onRequestQuote = { navController.navigate(Routes.BOOKING) },
                onNavigate = { route -> navController.navigate(route) }
            )
        }
        composable(Routes.ABOUT) { AboutScreen(onBack = { navController.popBackStack() }) }
        composable(Routes.SERVICES) { ServicesScreen(onBack = { navController.popBackStack() }) }
        composable(Routes.CONTACT) { ContactScreen(onBack = { navController.popBackStack() }) }

        composable(Routes.BOOKING) {
            BookingScreen(
                onBack = { navController.popBackStack() },
                onSuccess = { reference ->
                    navController.navigate(Routes.bookingSuccess(reference)) {
                        popUpTo(Routes.HOME)
                    }
                }
            )
        }
        composable(
            route = Routes.BOOKING_SUCCESS,
            arguments = listOf(navArgument("reference") { type = NavType.StringType })
        ) { entry ->
            BookingSuccessScreen(
                reference = entry.arguments?.getString("reference").orEmpty(),
                onDone = { navController.popBackStack(Routes.HOME, inclusive = false) }
            )
        }

        // ---- Admin area: login gate ----
        composable(Routes.ADMIN_LOGIN) {
            LoginScreen(
                onBack = { navController.popBackStack() },
                onLoggedIn = {
                    navController.navigate(Routes.ADMIN_DASHBOARD) {
                        popUpTo(Routes.ADMIN_LOGIN) { inclusive = true }
                    }
                }
            )
        }
        composable(Routes.ADMIN_DASHBOARD) { backStackEntry ->
            GuardedAdmin(navController) {
                DashboardScreen(
                    onBack = { navController.popBackStack() },
                    onOpenBooking = { id -> navController.navigate(Routes.adminDetail(id)) },
                    onLoggedOut = {
                        navController.navigate(Routes.ADMIN_LOGIN) {
                            popUpTo(Routes.ADMIN_DASHBOARD) { inclusive = true }
                        }
                    }
                )
            }
        }
        composable(
            route = Routes.ADMIN_DETAIL,
            arguments = listOf(navArgument("id") { type = NavType.IntType })
        ) { entry ->
            val id = entry.arguments?.getInt("id") ?: return@composable
            GuardedAdmin(navController) {
                BookingDetailScreen(id = id, onBack = { navController.popBackStack() })
            }
        }
    }
}

/** ProtectedRoute equivalent: no stored token -> kick back to the login screen. */
@Composable
private fun GuardedAdmin(
    navController: NavHostController,
    content: @Composable () -> Unit
) {
    val vm: com.ganraj.logistics.ui.navigation.SessionCheckViewModel = hiltViewModel(
        navController.getBackStackEntry(Routes.HOME)
    )
    LaunchedEffect(Unit) { vm.check() }
    when {
        vm.checked.value && vm.hasSession.value -> content()
        vm.checked.value -> LaunchedEffect(Unit) {
            navController.navigate(Routes.ADMIN_LOGIN) {
                popUpTo(Routes.ADMIN_DASHBOARD) { inclusive = true }
            }
        }
    }
}
