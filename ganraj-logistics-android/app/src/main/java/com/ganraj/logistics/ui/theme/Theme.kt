package com.ganraj.logistics.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val GanrajColorScheme = lightColorScheme(
    primary = Navy900,          // app bars, key structural elements
    onPrimary = White,
    primaryContainer = Navy700,
    onPrimaryContainer = White,
    secondary = Orange500,      // CTAs / highlights
    onSecondary = White,
    secondaryContainer = Orange100,
    onSecondaryContainer = Navy900,
    background = OffWhite,
    onBackground = Navy900,
    surface = White,
    onSurface = Navy900,
    surfaceVariant = OffWhite,
    onSurfaceVariant = GreyText,
    error = Red600
)

@Composable
fun GanrajTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = GanrajColorScheme,
        typography = GanrajTypography,
        content = content
    )
}
