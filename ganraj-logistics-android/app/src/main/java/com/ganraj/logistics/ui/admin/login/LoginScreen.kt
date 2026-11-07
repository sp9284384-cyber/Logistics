package com.ganraj.logistics.ui.admin.login

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.ganraj.logistics.ui.components.AppTopBar
import com.ganraj.logistics.ui.components.LabeledTextField
import com.ganraj.logistics.ui.components.PrimaryButton

@Composable
fun LoginScreen(
    onBack: () -> Unit,
    onLoggedIn: () -> Unit,
    viewModel: LoginViewModel = hiltViewModel()
) {
    val state = viewModel.state
    Scaffold(topBar = { AppTopBar(title = "Admin Login", showBack = true, onBack = onBack) }) { padding ->
        Column(
            Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(24.dp),
            verticalArrangement = Arrangement.Center
        ) {
            Text("Admin Login", style = MaterialTheme.typography.headlineMedium,
                color = MaterialTheme.colorScheme.primary)
            Spacer(Modifier.height(6.dp))
            Text("Sign in to manage booking requests.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(Modifier.height(24.dp))

            LabeledTextField(
                label = "Email",
                value = state.email,
                onValueChange = viewModel::onEmailChange,
                error = state.emailError,
                placeholder = "admin@ganrajlogistics.in"
            )
            Spacer(Modifier.height(16.dp))
            LabeledTextField(
                label = "Password",
                value = state.password,
                onValueChange = viewModel::onPasswordChange,
                visualTransformation = PasswordVisualTransformation()
            )

            state.error?.let {
                Spacer(Modifier.height(12.dp))
                Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodyLarge)
            }

            Spacer(Modifier.height(24.dp))
            PrimaryButton(
                text = if (state.loading) "Signing in…" else "Sign In",
                onClick = { viewModel.login(onLoggedIn) },
                enabled = !state.loading
            )
        }
    }
}
