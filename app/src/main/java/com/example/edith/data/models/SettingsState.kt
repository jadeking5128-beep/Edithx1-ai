package com.example.edith.data.models

data class SettingsState(
    val speakReplies: Boolean = true,
    val voice: String = "Charon",
    val tone: String = "formal",
    val sensitive: String = "balanced",
    val fallbackKey1: String = "",
    val fallbackKey2: String = "",
    val fallbackKey3: String = ""
) {
    fun getCustomFallbackKeys(): List<String> {
        return listOf(fallbackKey1, fallbackKey2, fallbackKey3)
            .map { it.trim() }
            .filter { it.length > 5 }
    }
}
