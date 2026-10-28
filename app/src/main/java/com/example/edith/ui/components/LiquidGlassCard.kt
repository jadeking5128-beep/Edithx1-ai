package com.example.edith.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.edith.ui.theme.EdithGlassBorder
import com.example.edith.ui.theme.EdithGlassSpecular
import com.example.edith.ui.theme.EdithPrimary
import com.example.edith.ui.theme.EdithSurface
import com.example.edith.ui.theme.EdithSurfaceVariant

@Composable
fun LiquidGlassCard(
    modifier: Modifier = Modifier,
    shape: Shape = RoundedCornerShape(20.dp),
    glowColor: Color = EdithPrimary.copy(alpha = 0.25f),
    elevation: Dp = 8.dp,
    content: @Composable BoxScope.() -> Unit
) {
    val glassBrush = Brush.linearGradient(
        colors = listOf(
            EdithSurface.copy(alpha = 0.65f),
            EdithSurfaceVariant.copy(alpha = 0.35f),
            Color(0x1A38BDF8)
        )
    )

    val borderBrush = Brush.verticalGradient(
        colors = listOf(
            EdithGlassSpecular.copy(alpha = 0.45f),
            EdithGlassBorder.copy(alpha = 0.35f),
            Color(0x0D000000)
        )
    )

    Box(
        modifier = modifier
            .shadow(
                elevation = elevation,
                shape = shape,
                ambientColor = glowColor,
                spotColor = EdithPrimary.copy(alpha = 0.3f)
            )
            .clip(shape)
            .background(glassBrush)
            .border(
                width = 1.dp,
                brush = borderBrush,
                shape = shape
            )
    ) {
        content()
    }
}

@Composable
fun LiquidPillBadge(
    text: String,
    modifier: Modifier = Modifier,
    indicatorColor: Color = EdithPrimary,
    onClick: (() -> Unit)? = null
) {
    val shape = RoundedCornerShape(50)
    val clickableModifier = if (onClick != null) {
        Modifier.clickable(
            interactionSource = remember { MutableInteractionSource() },
            indication = null,
            onClick = onClick
        )
    } else Modifier

    Box(
        modifier = modifier
            .clip(shape)
            .background(
                Brush.horizontalGradient(
                    listOf(
                        EdithSurface.copy(alpha = 0.8f),
                        EdithSurfaceVariant.copy(alpha = 0.5f)
                    )
                )
            )
            .border(
                width = 1.dp,
                brush = Brush.horizontalGradient(
                    listOf(
                        indicatorColor.copy(alpha = 0.6f),
                        EdithGlassBorder.copy(alpha = 0.3f)
                    )
                ),
                shape = shape
            )
            .then(clickableModifier)
            .padding(horizontal = 12.dp, vertical = 6.dp),
        contentAlignment = Alignment.Center
    ) {
        androidx.compose.foundation.layout.Row(
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .padding(end = 6.dp)
                    .clip(RoundedCornerShape(50))
                    .background(indicatorColor)
                    .padding(4.dp)
            )
            Text(
                text = text,
                color = Color(0xFFF1F5F9),
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                fontFamily = FontFamily.Monospace,
                letterSpacing = 0.8.sp
            )
        }
    }
}
