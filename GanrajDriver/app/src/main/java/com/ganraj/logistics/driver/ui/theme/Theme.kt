package com.ganraj.logistics.driver.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColors = lightColorScheme(
    primary = GlsNavy,
    onPrimary = GlsWhite,
    secondary = GlsOrange,
    onSecondary = GlsWhite,
    background = GlsBackgroundLight,
    onBackground = GlsNavy,
    surface = GlsWhite,
    onSurface = GlsNavy,
    error = StatusRed
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFF9DB7F5),
    onPrimary = GlsNavy,
    secondary = GlsOrange,
    onSecondary = GlsWhite,
    background = GlsBackgroundDark,
    onBackground = Color(0xFFE8ECF6),
    surface = GlsSurfaceDark,
    onSurface = Color(0xFFE8ECF6),
    error = Color(0xFFFF8A8A)
)

@Composable
fun GanrajDriverTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        typography = Typography,
        content = content
    )
}
