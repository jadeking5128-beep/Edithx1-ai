package com.example.edith.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = EdithPrimary,
    onPrimary = EdithBackground,
    secondary = EdithSecondary,
    onSecondary = EdithTextPrimary,
    tertiary = EdithTertiary,
    background = EdithBackground,
    onBackground = EdithTextPrimary,
    surface = EdithSurface,
    onSurface = EdithTextPrimary,
    surfaceVariant = EdithSurfaceVariant,
    onSurfaceVariant = EdithTextSecondary,
    error = EdithError,
    onError = EdithBackground
)

@Composable
fun EdithTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        content = content
    )
}
