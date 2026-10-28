package com.example.edith.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Key
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.edith.data.models.SettingsState
import com.example.edith.ui.theme.EdithGlassBorder
import com.example.edith.ui.theme.EdithPrimary
import com.example.edith.ui.theme.EdithSecondary
import com.example.edith.ui.theme.EdithSuccess
import com.example.edith.ui.theme.EdithSurface
import com.example.edith.ui.theme.EdithTextPrimary
import com.example.edith.ui.theme.EdithTextSecondary

@Composable
fun SettingsDialog(
    settings: SettingsState,
    activeKeyLabel: String,
    totalFailovers: Int,
    onSaveSettings: (SettingsState) -> Unit,
    onDismiss: () -> Unit
) {
    var speakReplies by remember { mutableStateOf(settings.speakReplies) }
    var key1 by remember { mutableStateOf(settings.fallbackKey1) }
    var key2 by remember { mutableStateOf(settings.fallbackKey2) }
    var key3 by remember { mutableStateOf(settings.fallbackKey3) }
    var tone by remember { mutableStateOf(settings.tone) }

    Dialog(onDismissRequest = onDismiss) {
        LiquidGlassCard(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 16.dp),
            shape = RoundedCornerShape(24.dp),
            elevation = 16.dp
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Shield,
                            contentDescription = "Tactical Settings",
                            tint = EdithPrimary,
                            modifier = Modifier.padding(end = 8.dp)
                        )
                        Text(
                            text = "EDITH TACTICAL SETTINGS",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            color = EdithTextPrimary,
                            letterSpacing = 1.sp
                        )
                    }
                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier.testTag("settings_close_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Close",
                            tint = EdithTextSecondary
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Active Key & Failover Telemetry
                LiquidGlassCard(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    elevation = 2.dp
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(
                            text = "ACTIVE PROTOCOL ENGINE",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            fontFamily = FontFamily.Monospace,
                            color = EdithSecondary
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = activeKeyLabel,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Medium,
                            color = EdithTextPrimary
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = "Automatic Failover Pool:",
                                fontSize = 11.sp,
                                color = EdithTextSecondary
                            )
                            Text(
                                text = "$totalFailovers Cascades",
                                fontSize = 11.sp,
                                color = if (totalFailovers > 0) EdithPrimary else EdithSuccess,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Multi-Key Fallback Pool Configuration
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Key,
                        contentDescription = "Keys",
                        tint = EdithPrimary,
                        modifier = Modifier.padding(end = 6.dp)
                    )
                    Text(
                        text = "3-TIER GEMINI FALLBACK POOL",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        color = EdithPrimary
                    )
                }

                Text(
                    text = "If primary quota/credits run out, EDITH automatically cascades to these backup API keys seamlessly without interruption.",
                    fontSize = 11.sp,
                    color = EdithTextSecondary,
                    modifier = Modifier.padding(vertical = 6.dp)
                )

                // Fallback Key 1
                OutlinedTextField(
                    value = key1,
                    onValueChange = { key1 = it },
                    label = { Text("Fallback Gemini Key #1", fontSize = 12.sp) },
                    placeholder = { Text("AIzaSy...", fontSize = 12.sp) },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = EdithPrimary,
                        unfocusedBorderColor = EdithGlassBorder,
                        focusedLabelColor = EdithPrimary,
                        unfocusedLabelColor = EdithTextSecondary,
                        focusedTextColor = EdithTextPrimary,
                        unfocusedTextColor = EdithTextPrimary
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp)
                        .testTag("fallback_key_1_input")
                )

                // Fallback Key 2
                OutlinedTextField(
                    value = key2,
                    onValueChange = { key2 = it },
                    label = { Text("Fallback Gemini Key #2", fontSize = 12.sp) },
                    placeholder = { Text("AIzaSy...", fontSize = 12.sp) },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = EdithPrimary,
                        unfocusedBorderColor = EdithGlassBorder,
                        focusedLabelColor = EdithPrimary,
                        unfocusedLabelColor = EdithTextSecondary,
                        focusedTextColor = EdithTextPrimary,
                        unfocusedTextColor = EdithTextPrimary
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp)
                        .testTag("fallback_key_2_input")
                )

                // Fallback Key 3
                OutlinedTextField(
                    value = key3,
                    onValueChange = { key3 = it },
                    label = { Text("Fallback Gemini Key #3", fontSize = 12.sp) },
                    placeholder = { Text("AIzaSy...", fontSize = 12.sp) },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = EdithPrimary,
                        unfocusedBorderColor = EdithGlassBorder,
                        focusedLabelColor = EdithPrimary,
                        unfocusedLabelColor = EdithTextSecondary,
                        focusedTextColor = EdithTextPrimary,
                        unfocusedTextColor = EdithTextPrimary
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp)
                        .testTag("fallback_key_3_input")
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Voice Speech Setting
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.VolumeUp,
                            contentDescription = "Voice",
                            tint = EdithSecondary,
                            modifier = Modifier.padding(end = 8.dp)
                        )
                        Column {
                            Text(
                                text = "Tactical Voice Output",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Medium,
                                color = EdithTextPrimary
                            )
                            Text(
                                text = "Read responses with Android TTS",
                                fontSize = 11.sp,
                                color = EdithTextSecondary
                            )
                        }
                    }
                    Switch(
                        checked = speakReplies,
                        onCheckedChange = { speakReplies = it },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = EdithPrimary,
                            checkedTrackColor = EdithPrimary.copy(alpha = 0.3f),
                            uncheckedThumbColor = EdithTextSecondary,
                            uncheckedTrackColor = Color.Black.copy(alpha = 0.4f)
                        ),
                        modifier = Modifier.testTag("voice_output_switch")
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Tactical Tone Selection
                Text(
                    text = "AI RESPONSE PROTOCOL TONE",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    fontFamily = FontFamily.Monospace,
                    color = EdithSecondary
                )
                Spacer(modifier = Modifier.height(6.dp))
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    listOf("formal" to "Tactical", "snarky" to "Stark", "concise" to "Brief").forEach { (id, label) ->
                        val isSelected = tone == id
                        LiquidPillBadge(
                            text = label,
                            indicatorColor = if (isSelected) EdithPrimary else EdithTextSecondary,
                            modifier = Modifier.weight(1f),
                            onClick = { tone = id }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Save Action Button
                Button(
                    onClick = {
                        onSaveSettings(
                            settings.copy(
                                speakReplies = speakReplies,
                                fallbackKey1 = key1,
                                fallbackKey2 = key2,
                                fallbackKey3 = key3,
                                tone = tone
                            )
                        )
                        onDismiss()
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = EdithPrimary,
                        contentColor = Color(0xFF030712)
                    ),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .testTag("settings_save_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.Check,
                        contentDescription = "Save",
                        modifier = Modifier.padding(end = 6.dp)
                    )
                    Text(
                        text = "LOCK IN PROTOCOL CONFIG",
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        letterSpacing = 1.sp
                    )
                }
            }
        }
    }
}
