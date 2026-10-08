package com.ganraj.logistics.driver.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.ganraj.logistics.driver.ui.auth.LoginRoute
import com.ganraj.logistics.driver.ui.map.MapScreen
import com.ganraj.logistics.driver.ui.orders.OrderDetailScreen
import com.ganraj.logistics.driver.ui.orders.OrdersListScreen

/**
 * Login -> Orders list -> Order detail -> Map.
 * Redirects to login whenever there is no token, and opens an order when a push is tapped.
 */
@Composable
fun AppNavGraph(
    pendingOrderId: Long?,
    onPendingOrderConsumed: () -> Unit,
    session: SessionViewModel = hiltViewModel()
) {
    val navController = rememberNavController()
    val token by session.token.collectAsStateWithLifecycle()
    val loggedIn = token != null
    val startDestination = remember { if (session.token.value != null) Routes.ORDERS else Routes.LOGIN }

    NavHost(navController = navController, startDestination = startDestination) {
        composable(Routes.LOGIN) { LoginRoute() }

        composable(Routes.ORDERS) {
            OrdersListScreen(
                onOpenOrder = { navController.navigate(Routes.orderDetail(it)) },
                onLogout = session::logout
            )
        }

        composable(
            route = Routes.ORDER_DETAIL,
            arguments = listOf(navArgument(Routes.ARG_ORDER_ID) { type = NavType.LongType })
        ) { entry ->
            val id = entry.arguments?.getLong(Routes.ARG_ORDER_ID) ?: 0L
            OrderDetailScreen(
                onBack = { navController.popBackStack() },
                onOpenMap = { navController.navigate(Routes.map(id)) }
            )
        }

        composable(
            route = Routes.MAP,
            arguments = listOf(navArgument(Routes.ARG_ORDER_ID) { type = NavType.LongType })
        ) {
            MapScreen(onBack = { navController.popBackStack() })
        }
    }

    // Token appears -> leave login. Token disappears (logout / expired) -> back to login.
    LaunchedEffect(loggedIn) {
        val current = navController.currentBackStackEntry?.destination?.route
        if (loggedIn && current == Routes.LOGIN) {
            navController.navigate(Routes.ORDERS) { popUpTo(Routes.LOGIN) { inclusive = true } }
        } else if (!loggedIn && current != Routes.LOGIN) {
            navController.navigate(Routes.LOGIN) { popUpTo(0) { inclusive = true } }
        }
    }

    // A tapped push notification opens that order.
    LaunchedEffect(pendingOrderId, loggedIn) {
        if (pendingOrderId != null && loggedIn) {
            navController.navigate(Routes.orderDetail(pendingOrderId))
            onPendingOrderConsumed()
        }
    }
}
