package com.example.edith.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DeleteSweep
import androidx.compose.material.icons.filled.GraphicEq
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.edith.data.models.ChatMessage
import com.example.edith.ui.components.CoreState
import com.example.edith.ui.components.LiquidGlassCard
import com.example.edith.ui.components.LiquidPillBadge
import com.example.edith.ui.components.LiquidReactorCore
import com.example.edith.ui.components.SettingsDialog
import com.example.edith.ui.theme.EdithBackground
import com.example.edith.ui.theme.EdithGlassBorder
import com.example.edith.ui.theme.EdithGlassSpecular
import com.example.edith.ui.theme.EdithPrimary
import com.example.edith.ui.theme.EdithSecondary
import com.example.edith.ui.theme.EdithTertiary
import com.example.edith.ui.theme.EdithSuccess
import com.example.edith.ui.theme.EdithSurface
import com.example.edith.ui.theme.EdithSurfaceVariant
import com.example.edith.ui.theme.EdithTextPrimary
import com.example.edith.ui.theme.EdithTextSecondary
import com.example.edith.ui.theme.EdithWarning

@Composable
fun HomeScreen(
    viewModel: MainViewModel,
    onRequestMicrophonePermission: () -> Unit
) {
    val messages by viewModel.messages.collectAsState()
    val coreState by viewModel.coreState.collectAsState()
    val audioLevel by viewModel.audioLevel.collectAsState()
    val activeKeyLabel by viewModel.activeKeyLabel.collectAsState()
    val totalFailovers by viewModel.totalFailovers.collectAsState()
    val statusMessage by viewModel.statusMessage.collectAsState()
    val currentTab by viewModel.currentTab.collectAsState()
    val settings by viewModel.settings.collectAsState()
    val isListening by viewModel.isListening.collectAsState()

    var showSettingsDialog by remember { mutableStateOf(false) }
    var inputText by remember { mutableStateOf("") }
    val listState = rememberLazyListState()

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    Scaffold(
        modifier = Modifier
            .fillMaxSize()
            .background(EdithBackground),
        containerColor = EdithBackground
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Color(0xFF040714),
                            EdithBackground,
                            Color(0xFF030712)
                        )
                    )
                )
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .imePadding()
            ) {
                // Top Tactical HUD Bar
                TacticalTopBar(
                    statusMessage = statusMessage,
                    failovers = totalFailovers,
                    onOpenSettings = { showSettingsDialog = true },
                    onClearComms = { viewModel.clearHistory() }
                )

                // Mode Tabs (HUD vs COMMS)
                ModeSelectorBar(
                    currentTab = currentTab,
                    onTabSelected = { viewModel.setTab(it) }
                )

                // Content Body
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                ) {
                    if (currentTab == 0) {
                        TacticalHudView(
                            coreState = coreState,
                            audioLevel = audioLevel,
                            activeKey = activeKeyLabel,
                            onCoreClick = {
                                onRequestMicrophonePermission()
                                viewModel.toggleVoiceListening()
                            },
                            onChipClick = { prompt ->
                                viewModel.sendMessage(prompt)
                            }
                        )
                    } else {
                        CommsFeedView(
                            messages = messages,
                            listState = listState,
                            onSpeakMessage = { viewModel.speakText(it) }
                        )
                    }
                }

                // Bottom Tactical Input Dock
                TacticalInputDock(
                    inputText = inputText,
                    isListening = isListening,
                    onInputChanged = { inputText = it },
                    onSend = {
                        if (inputText.isNotBlank()) {
                            viewModel.sendMessage(inputText)
                            inputText = ""
                        }
                    },
                    onToggleVoice = {
                        onRequestMicrophonePermission()
                        viewModel.toggleVoiceListening()
                    }
                )
            }
        }
    }

    if (showSettingsDialog) {
        SettingsDialog(
            settings = settings,
            activeKeyLabel = activeKeyLabel,
            totalFailovers = totalFailovers,
            onSaveSettings = { viewModel.updateSettings(it) },
            onDismiss = { showSettingsDialog = false }
        )
    }
}

@Composable
private fun TacticalTopBar(
    statusMessage: String,
    failovers: Int,
    onOpenSettings: () -> Unit,
    onClearComms: () -> Unit
) {
    LiquidGlassCard(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 14.dp, vertical = 8.dp),
        shape = RoundedCornerShape(16.dp),
        elevation = 4.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .clip(CircleShape)
                            .background(EdithSuccess)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "E.D.I.T.H. X1",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.ExtraBold,
                        fontFamily = FontFamily.Monospace,
                        color = EdithTextPrimary,
                        letterSpacing = 1.2.sp
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "v2.5",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = EdithPrimary
                    )
                }
                Text(
                    text = statusMessage.uppercase(),
                    fontSize = 10.sp,
                    fontFamily = FontFamily.Monospace,
                    color = if (failovers > 0) EdithWarning else EdithTextSecondary,
                    letterSpacing = 0.5.sp
                )
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(
                    onClick = onClearComms,
                    modifier = Modifier.testTag("clear_comms_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.DeleteSweep,
                        contentDescription = "Clear Comms",
                        tint = EdithTextSecondary
                    )
                }

                IconButton(
                    onClick = onOpenSettings,
                    modifier = Modifier.testTag("settings_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.Settings,
                        contentDescription = "Tactical Settings",
                        tint = EdithPrimary
                    )
                }
            }
        }
    }
}

@Composable
private fun ModeSelectorBar(
    currentTab: Int,
    onTabSelected: (Int) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        listOf("TACTICAL HUD", "COMMS FEED").forEachIndexed { index, title ->
            val isSelected = currentTab == index
            LiquidPillBadge(
                text = title,
                indicatorColor = if (isSelected) EdithPrimary else Color.Transparent,
                modifier = Modifier.weight(1f),
                onClick = { onTabSelected(index) }
            )
        }
    }
}

@Composable
private fun TacticalHudView(
    coreState: CoreState,
    audioLevel: Float,
    activeKey: String,
    onCoreClick: () -> Unit,
    onChipClick: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // Telemetry readout
        LiquidGlassCard(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            elevation = 2.dp
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "FAILOVER: 4-KEY ENGINE",
                    fontSize = 10.sp,
                    fontFamily = FontFamily.Monospace,
                    color = EdithTextSecondary
                )
                Text(
                    text = activeKey.take(24),
                    fontSize = 10.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    color = EdithPrimary
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Center Reactor Core
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.Center
        ) {
            LiquidReactorCore(
                state = coreState,
                audioLevel = audioLevel,
                size = 240.dp,
                onClick = onCoreClick
            )

            Spacer(modifier = Modifier.height(16.dp))

            val actionPrompt = when (coreState) {
                CoreState.IDLE -> "TAP REACTOR FOR VOICE INGESTION"
                CoreState.LISTENING -> "LISTENING... SPEAK COMMAND"
                CoreState.THINKING -> "COMPUTING NEURAL TACTICAL RESPONSE..."
                CoreState.SPEAKING -> "EDITH DISPATCHING AUDIO TRANSMISSION..."
                CoreState.ERROR -> "SYSTEM ERROR // CHECK KEYS"
            }

            Text(
                text = actionPrompt,
                fontSize = 12.sp,
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.Bold,
                color = when (coreState) {
                    CoreState.LISTENING -> EdithTertiary
                    CoreState.THINKING -> EdithWarning
                    CoreState.ERROR -> Color(0xFFF87171)
                    else -> EdithTextPrimary
                },
                letterSpacing = 1.sp
            )
        }

        // Quick Tactical Directive Chips
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "TACTICAL DIRECTIVES",
                fontSize = 10.sp,
                fontFamily = FontFamily.Monospace,
                color = EdithTextSecondary,
                letterSpacing = 1.sp,
                modifier = Modifier.padding(bottom = 6.dp)
            )

            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                listOf(
                    "System diagnostics",
                    "Security report",
                    "Failover status"
                ).forEach { prompt ->
                    LiquidPillBadge(
                        text = prompt,
                        indicatorColor = EdithSecondary,
                        modifier = Modifier.weight(1f),
                        onClick = { onChipClick(prompt) }
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))
    }
}

@Composable
private fun CommsFeedView(
    messages: List<ChatMessage>,
    listState: androidx.compose.foundation.lazy.LazyListState,
    onSpeakMessage: (String) -> Unit
) {
    LazyColumn(
        state = listState,
        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 10.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        modifier = Modifier.fillMaxSize()
    ) {
        items(messages, key = { it.id }) { msg ->
            val isUser = msg.role == "user"

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start
            ) {
                LiquidGlassCard(
                    modifier = Modifier
                        .fillMaxWidth(if (isUser) 0.8f else 0.88f),
                    shape = RoundedCornerShape(
                        topStart = 16.dp,
                        topEnd = 16.dp,
                        bottomStart = if (isUser) 16.dp else 4.dp,
                        bottomEnd = if (isUser) 4.dp else 16.dp
                    ),
                    glowColor = if (isUser) EdithPrimary.copy(alpha = 0.35f) else Color.Transparent,
                    elevation = 4.dp
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = if (isUser) "OPERATOR" else "EDITH X1",
                                fontSize = 10.sp,
                                fontFamily = FontFamily.Monospace,
                                fontWeight = FontWeight.Bold,
                                color = if (isUser) EdithPrimary else EdithSecondary,
                                letterSpacing = 1.sp
                            )

                            if (!isUser) {
                                IconButton(
                                    onClick = { onSpeakMessage(msg.content) },
                                    modifier = Modifier.size(24.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.VolumeUp,
                                        contentDescription = "Speak Message",
                                        tint = EdithTextSecondary,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(4.dp))

                        Text(
                            text = msg.content,
                            fontSize = 13.sp,
                            color = EdithTextPrimary,
                            lineHeight = 19.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun TacticalInputDock(
    inputText: String,
    isListening: Boolean,
    onInputChanged: (String) -> Unit,
    onSend: () -> Unit,
    onToggleVoice: () -> Unit
) {
    LiquidGlassCard(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 14.dp, vertical = 8.dp),
        shape = RoundedCornerShape(20.dp),
        elevation = 8.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Voice Mic Button
            IconButton(
                onClick = onToggleVoice,
                modifier = Modifier
                    .clip(CircleShape)
                    .background(
                        if (isListening) EdithPrimary else EdithSurfaceVariant
                    )
                    .size(42.dp)
                    .testTag("voice_mic_button")
            ) {
                Icon(
                    imageVector = if (isListening) Icons.Default.GraphicEq else Icons.Default.Mic,
                    contentDescription = "Voice Ingestion",
                    tint = if (isListening) Color(0xFF030712) else EdithPrimary,
                    modifier = Modifier.size(20.dp)
                )
            }

            Spacer(modifier = Modifier.width(8.dp))

            // Text Input Field
            OutlinedTextField(
                value = inputText,
                onValueChange = onInputChanged,
                placeholder = {
                    Text(
                        text = "Directive for EDITH...",
                        fontSize = 13.sp,
                        color = EdithTextSecondary
                    )
                },
                singleLine = true,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                keyboardActions = KeyboardActions(onSend = { onSend() }),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Color.Transparent,
                    unfocusedBorderColor = Color.Transparent,
                    focusedTextColor = EdithTextPrimary,
                    unfocusedTextColor = EdithTextPrimary
                ),
                modifier = Modifier
                    .weight(1f)
                    .testTag("command_input_field")
            )

            // Send Button
            IconButton(
                onClick = onSend,
                enabled = inputText.isNotBlank(),
                modifier = Modifier
                    .clip(CircleShape)
                    .background(
                        if (inputText.isNotBlank()) EdithPrimary else EdithSurface.copy(alpha = 0.5f)
                    )
                    .size(42.dp)
                    .testTag("send_button")
            ) {
                Icon(
                    imageVector = Icons.Default.Send,
                    contentDescription = "Send Directive",
                    tint = if (inputText.isNotBlank()) Color(0xFF030712) else EdithTextSecondary,
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }
}
