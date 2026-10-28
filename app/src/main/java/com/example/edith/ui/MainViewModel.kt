package com.example.edith.ui

import android.app.Application
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.edith.data.GeminiRepository
import com.example.edith.data.models.ChatMessage
import com.example.edith.data.models.SettingsState
import com.example.edith.ui.components.CoreState
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.util.Locale

class MainViewModel(application: Application) : AndroidViewModel(application), TextToSpeech.OnInitListener {

    private val prefs = application.getSharedPreferences("edith_prefs", Context.MODE_PRIVATE)
    private val geminiRepo = GeminiRepository()

    private val _messages = MutableStateFlow<List<ChatMessage>>(
        listOf(
            ChatMessage(
                role = "assistant",
                content = "EDITH Tactical Systems Online. All security protocols armed. Awaiting command, Boss."
            )
        )
    )
    val messages = _messages.asStateFlow()

    private val _coreState = MutableStateFlow(CoreState.IDLE)
    val coreState = _coreState.asStateFlow()

    private val _audioLevel = MutableStateFlow(0f)
    val audioLevel = _audioLevel.asStateFlow()

    private val _activeKeyLabel = MutableStateFlow("Primary Key (Active)")
    val activeKeyLabel = _activeKeyLabel.asStateFlow()

    private val _totalFailovers = MutableStateFlow(0)
    val totalFailovers = _totalFailovers.asStateFlow()

    private val _statusMessage = MutableStateFlow("SYSTEMS NORMAL // 100% SECURE")
    val statusMessage = _statusMessage.asStateFlow()

    private val _isListening = MutableStateFlow(false)
    val isListening = _isListening.asStateFlow()

    private val _currentTab = MutableStateFlow(0) // 0: Tactical HUD, 1: Comms Feed
    val currentTab = _currentTab.asStateFlow()

    private val _settings = MutableStateFlow(
        SettingsState(
            speakReplies = prefs.getBoolean("speak_replies", true),
            voice = prefs.getString("voice", "Charon") ?: "Charon",
            tone = prefs.getString("tone", "formal") ?: "formal",
            fallbackKey1 = prefs.getString("fallback_key_1", "") ?: "",
            fallbackKey2 = prefs.getString("fallback_key_2", "") ?: "",
            fallbackKey3 = prefs.getString("fallback_key_3", "") ?: ""
        )
    )
    val settings = _settings.asStateFlow()

    private var tts: TextToSpeech? = null
    private var isTtsReady = false
    private var speechRecognizer: SpeechRecognizer? = null
    private var waveAnimationJob: Job? = null

    init {
        tts = TextToSpeech(application, this)
        initSpeechRecognizer()
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            tts?.language = Locale.US
            tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                override fun onStart(utteranceId: String?) {
                    _coreState.value = CoreState.SPEAKING
                    startSimulatedAudioWave()
                }

                override fun onDone(utteranceId: String?) {
                    stopSimulatedAudioWave()
                    _coreState.value = CoreState.IDLE
                }

                @Deprecated("Deprecated in Java")
                override fun onError(utteranceId: String?) {
                    stopSimulatedAudioWave()
                    _coreState.value = CoreState.IDLE
                }
            })
            isTtsReady = true
        }
    }

    private fun initSpeechRecognizer() {
        if (SpeechRecognizer.isRecognitionAvailable(getApplication())) {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(getApplication()).apply {
                setRecognitionListener(object : RecognitionListener {
                    override fun onReadyForSpeech(params: Bundle?) {
                        _statusMessage.value = "LISTENING FOR TACTICAL AUDIO..."
                    }

                    override fun onBeginningOfSpeech() {
                        _coreState.value = CoreState.LISTENING
                    }

                    override fun onRmsChanged(rmsdB: Float) {
                        // Normalize dB into 0..1 scale
                        val normalized = ((rmsdB + 2f) / 12f).coerceIn(0.1f, 1f)
                        _audioLevel.value = normalized
                    }

                    override fun onBufferReceived(buffer: ByteArray?) {}

                    override fun onEndOfSpeech() {
                        _isListening.value = false
                        _coreState.value = CoreState.THINKING
                        _statusMessage.value = "PROCESSING AUDIO INGESTION..."
                    }

                    override fun onError(error: Int) {
                        _isListening.value = false
                        _coreState.value = CoreState.IDLE
                        _statusMessage.value = "VOICE INPUT TIMED OUT"
                    }

                    override fun onResults(results: Bundle?) {
                        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        val text = matches?.firstOrNull()
                        if (!text.isNullOrBlank()) {
                            sendMessage(text)
                        } else {
                            _coreState.value = CoreState.IDLE
                            _statusMessage.value = "NO SPEECH DETECTED"
                        }
                    }

                    override fun onPartialResults(partialResults: Bundle?) {}
                    override fun onEvent(eventType: Int, params: Bundle?) {}
                })
            }
        }
    }

    fun setTab(index: Int) {
        _currentTab.value = index
    }

    fun toggleVoiceListening() {
        if (_isListening.value) {
            stopListening()
        } else {
            startListening()
        }
    }

    fun startListening() {
        if (speechRecognizer != null) {
            try {
                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault())
                    putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
                }
                speechRecognizer?.startListening(intent)
                _isListening.value = true
                _coreState.value = CoreState.LISTENING
                _statusMessage.value = "EDITH LISTENING PROTOCOL ENGAGED"
            } catch (e: Exception) {
                Log.e("MainViewModel", "Error starting speech recognition", e)
                _statusMessage.value = "AUDIO RECOGNIZER ERROR"
            }
        } else {
            _statusMessage.value = "VOICE RECOGNITION NOT AVAILABLE ON DEVICE"
        }
    }

    fun stopListening() {
        try {
            speechRecognizer?.stopListening()
        } catch (_: Exception) {}
        _isListening.value = false
        _coreState.value = CoreState.IDLE
        _statusMessage.value = "SYSTEMS STANDBY"
    }

    fun sendMessage(userText: String) {
        val trimmed = userText.trim()
        if (trimmed.isEmpty()) return

        val userMessage = ChatMessage(role = "user", content = trimmed)
        val updated = _messages.value + userMessage
        _messages.value = updated

        _coreState.value = CoreState.THINKING
        _statusMessage.value = "CALCULATING TACTICAL RESPONSE..."

        val promptTone = when (_settings.value.tone) {
            "snarky" -> "You are EDITH. Speak with witty, sarcastic Stark flair, quick humor, but razor-sharp tactical intelligence. Keep answers direct."
            "concise" -> "You are EDITH. Give ultra-concise, telegram-style tactical summaries. Zero filler."
            else -> "You are EDITH (Even Dead, I'm The Hero). Speak with calm, sophisticated precision and tactical clarity."
        }

        viewModelScope.launch {
            val result = geminiRepo.generateReply(
                messages = updated,
                customFallbackKeys = _settings.value.getCustomFallbackKeys(),
                systemPrompt = promptTone
            )

            result.fold(
                onSuccess = { resp ->
                    _activeKeyLabel.value = resp.keyLabel
                    if (resp.failedAttempts > 0) {
                        _totalFailovers.value += resp.failedAttempts
                        _statusMessage.value = "FAILOVER ACTIVATED: ${resp.keyLabel.uppercase()}"
                    } else {
                        _statusMessage.value = "SECURE PROTOCOL CONFIRMED"
                    }

                    val assistantMessage = ChatMessage(role = "assistant", content = resp.text)
                    _messages.value = _messages.value + assistantMessage

                    if (_settings.value.speakReplies) {
                        speakText(resp.text)
                    } else {
                        _coreState.value = CoreState.IDLE
                    }
                },
                onFailure = { error ->
                    _coreState.value = CoreState.ERROR
                    _statusMessage.value = "ALL PROTOCOLS FAILED: ${error.localizedMessage?.take(30)}..."
                    val errorMsg = ChatMessage(
                        role = "assistant",
                        content = "Warning: Failed to execute neural network query. Error: ${error.message}. Please verify API keys in Settings."
                    )
                    _messages.value = _messages.value + errorMsg
                    delay(3000)
                    _coreState.value = CoreState.IDLE
                }
            )
        }
    }

    fun speakText(text: String) {
        if (!isTtsReady) return
        val cleanText = text.replace(Regex("[*#_`>]"), "").take(400)
        tts?.speak(cleanText, TextToSpeech.QUEUE_FLUSH, null, "edith_utterance_${System.currentTimeMillis()}")
    }

    fun stopSpeaking() {
        tts?.stop()
        stopSimulatedAudioWave()
        _coreState.value = CoreState.IDLE
    }

    private fun startSimulatedAudioWave() {
        waveAnimationJob?.cancel()
        waveAnimationJob = viewModelScope.launch {
            while (isActive) {
                _audioLevel.value = (0.2f + (Math.random() * 0.7f).toFloat())
                delay(120)
            }
        }
    }

    private fun stopSimulatedAudioWave() {
        waveAnimationJob?.cancel()
        _audioLevel.value = 0f
    }

    fun updateSettings(newSettings: SettingsState) {
        _settings.value = newSettings
        prefs.edit().apply {
            putBoolean("speak_replies", newSettings.speakReplies)
            putString("voice", newSettings.voice)
            putString("tone", newSettings.tone)
            putString("fallback_key_1", newSettings.fallbackKey1)
            putString("fallback_key_2", newSettings.fallbackKey2)
            putString("fallback_key_3", newSettings.fallbackKey3)
            apply()
        }
        _statusMessage.value = "TACTICAL SETTINGS SYNCHRONIZED"
    }

    fun clearHistory() {
        _messages.value = listOf(
            ChatMessage(
                role = "assistant",
                content = "Comms buffer cleared. Ready for new objective, Boss."
            )
        )
        _statusMessage.value = "COMMS BUFFER PURGED"
    }

    override fun onCleared() {
        super.onCleared()
        try {
            speechRecognizer?.destroy()
        } catch (_: Exception) {}
        try {
            tts?.stop()
            tts?.shutdown()
        } catch (_: Exception) {}
    }
}
