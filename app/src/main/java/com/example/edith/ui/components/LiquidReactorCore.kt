package com.example.edith.ui.components

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.example.edith.ui.theme.EdithBackground
import com.example.edith.ui.theme.EdithError
import com.example.edith.ui.theme.EdithGlassSpecular
import com.example.edith.ui.theme.EdithPrimary
import com.example.edith.ui.theme.EdithSecondary
import com.example.edith.ui.theme.EdithTertiary
import com.example.edith.ui.theme.EdithWarning
import kotlin.math.cos
import kotlin.math.sin

enum class CoreState {
    IDLE,
    LISTENING,
    THINKING,
    SPEAKING,
    ERROR
}

@Composable
fun LiquidReactorCore(
    state: CoreState,
    audioLevel: Float, // Normalized 0f..1f
    modifier: Modifier = Modifier,
    size: Dp = 260.dp,
    onClick: () -> Unit
) {
    val transition = rememberInfiniteTransition(label = "reactorCoreAnim")

    // Slow rotation for outer HUD ring
    val outerAngle by transition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(22000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "outerAngle"
    )

    // Reverse fast rotation for inner tactical ring
    val innerAngle by transition.animateFloat(
        initialValue = 360f,
        targetValue = 0f,
        animationSpec = infiniteRepeatable(
            animation = tween(12000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "innerAngle"
    )

    // Pulse wave for core breathing
    val pulseRatio by transition.animateFloat(
        initialValue = 0.94f,
        targetValue = 1.06f,
        animationSpec = infiniteRepeatable(
            animation = tween(1800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseRatio"
    )

    // Ripple radius expander for active state
    val rippleProgress by transition.animateFloat(
        initialValue = 0.2f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(1600, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "rippleProgress"
    )

    // Color coordination based on state
    val primaryColor = when (state) {
        CoreState.IDLE -> EdithPrimary
        CoreState.LISTENING -> EdithTertiary
        CoreState.THINKING -> EdithWarning
        CoreState.SPEAKING -> EdithSecondary
        CoreState.ERROR -> EdithError
    }

    val energyColor = when (state) {
        CoreState.IDLE -> EdithSecondary
        CoreState.LISTENING -> Color(0xFF67E8F9)
        CoreState.THINKING -> Color(0xFFFDE047)
        CoreState.SPEAKING -> Color(0xFF38BDF8)
        CoreState.ERROR -> Color(0xFFF87171)
    }

    Box(
        modifier = modifier
            .size(size)
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
                onClick = onClick
            )
            .testTag("liquid_reactor_core"),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.size(size)) {
            val center = Offset(size.toPx() / 2f, size.toPx() / 2f)
            val maxRadius = size.toPx() / 2f

            // Dynamic scale with audio level and pulse
            val audioBoost = if (state == CoreState.LISTENING || state == CoreState.SPEAKING) {
                audioLevel.coerceIn(0f, 1f) * 0.25f
            } else 0f

            val coreRadius = (maxRadius * 0.38f) * (pulseRatio + audioBoost)

            // 1. Ambient Glow Aura
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(
                        primaryColor.copy(alpha = 0.45f),
                        primaryColor.copy(alpha = 0.15f),
                        Color.Transparent
                    ),
                    center = center,
                    radius = maxRadius * 0.95f
                ),
                radius = maxRadius * 0.95f,
                center = center
            )

            // 2. Outward Ripples when active
            if (state == CoreState.LISTENING || state == CoreState.SPEAKING || state == CoreState.THINKING) {
                val currentRippleRadius = coreRadius + (maxRadius - coreRadius) * rippleProgress
                val rippleAlpha = (1f - rippleProgress).coerceIn(0f, 1f) * 0.5f
                drawCircle(
                    color = primaryColor.copy(alpha = rippleAlpha),
                    radius = currentRippleRadius,
                    center = center,
                    style = Stroke(width = 2.dp.toPx())
                )
            }

            // 3. Outer HUD Segmented Ring
            rotate(outerAngle, pivot = center) {
                // Dashed baseline circle
                drawCircle(
                    color = primaryColor.copy(alpha = 0.25f),
                    radius = maxRadius * 0.88f,
                    center = center,
                    style = Stroke(
                        width = 1.5.dp.toPx(),
                        pathEffect = PathEffect.dashPathEffect(floatArrayOf(12f, 12f), 0f)
                    )
                )

                // 3 segmented HUD brackets
                for (i in 0..2) {
                    val startAngle = i * 120f + 15f
                    drawArc(
                        color = primaryColor.copy(alpha = 0.85f),
                        startAngle = startAngle,
                        sweepAngle = 45f,
                        useCenter = false,
                        topLeft = Offset(center.x - maxRadius * 0.88f, center.y - maxRadius * 0.88f),
                        size = androidx.compose.ui.geometry.Size(maxRadius * 1.76f, maxRadius * 1.76f),
                        style = Stroke(width = 3.dp.toPx(), cap = StrokeCap.Round)
                    )
                }
            }

            // 4. Middle Tactical Ring with Compass Ticks
            rotate(innerAngle, pivot = center) {
                val midRadius = maxRadius * 0.68f
                drawCircle(
                    color = primaryColor.copy(alpha = 0.35f),
                    radius = midRadius,
                    center = center,
                    style = Stroke(width = 1.dp.toPx())
                )

                // 12 Tactical tick marks
                for (tick in 0 until 12) {
                    val angleRad = Math.toRadians((tick * 30).toDouble())
                    val tickLen = if (tick % 3 == 0) 12f else 6f
                    val r1 = midRadius - tickLen
                    val r2 = midRadius
                    val p1 = Offset(
                        center.x + (r1 * cos(angleRad)).toFloat(),
                        center.y + (r1 * sin(angleRad)).toFloat()
                    )
                    val p2 = Offset(
                        center.x + (r2 * cos(angleRad)).toFloat(),
                        center.y + (r2 * sin(angleRad)).toFloat()
                    )
                    drawLine(
                        color = if (tick % 3 == 0) primaryColor else primaryColor.copy(alpha = 0.4f),
                        start = p1,
                        end = p2,
                        strokeWidth = if (tick % 3 == 0) 2.dp.toPx() else 1.dp.toPx()
                    )
                }
            }

            // 5. Central Liquid Arc Reactor Core
            // Inner multi-gradient sphere
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(
                        Color.White.copy(alpha = 0.95f),
                        energyColor.copy(alpha = 0.85f),
                        primaryColor.copy(alpha = 0.9f),
                        EdithBackground.copy(alpha = 0.4f)
                    ),
                    center = Offset(center.x - coreRadius * 0.25f, center.y - coreRadius * 0.25f),
                    radius = coreRadius * 1.1f
                ),
                radius = coreRadius,
                center = center
            )

            // Concentric core ring
            drawCircle(
                color = Color.White.copy(alpha = 0.65f),
                radius = coreRadius * 0.55f,
                center = center,
                style = Stroke(width = 2.dp.toPx())
            )

            // Specular liquid glass reflection highlight (top-left crest)
            val highlightPath = Path().apply {
                val hr = coreRadius * 0.72f
                addOval(
                    androidx.compose.ui.geometry.Rect(
                        center.x - hr * 0.65f,
                        center.y - hr * 0.82f,
                        center.x + hr * 0.25f,
                        center.y - hr * 0.2f
                    )
                )
            }
            drawPath(
                path = highlightPath,
                brush = Brush.linearGradient(
                    colors = listOf(
                        EdithGlassSpecular.copy(alpha = 0.8f),
                        Color.Transparent
                    )
                )
            )

            // Tri-element central Stark node
            for (node in 0..2) {
                val nodeAngle = Math.toRadians((node * 120 + 30).toDouble())
                val nr = coreRadius * 0.45f
                val nPos = Offset(
                    center.x + (nr * cos(nodeAngle)).toFloat(),
                    center.y + (nr * sin(nodeAngle)).toFloat()
                )
                drawCircle(
                    color = Color.White,
                    radius = 3.dp.toPx(),
                    center = nPos
                )
            }
        }
    }
}
