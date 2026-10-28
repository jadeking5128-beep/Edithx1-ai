package com.example.edith.data

import android.util.Log
import com.example.edith.BuildConfig
import com.example.edith.data.models.ChatMessage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

data class GeminiResponse(
    val text: String,
    val keyUsedIndex: Int,
    val keyLabel: String,
    val failedAttempts: Int
)

class GeminiRepository {

    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    suspend fun generateReply(
        messages: List<ChatMessage>,
        customFallbackKeys: List<String> = emptyList(),
        systemPrompt: String = "You are EDITH X1 (Even Dead, I'm The Hero), an advanced tactical AI assistant designed by Tony Stark. You speak with calm, sophisticated precision, quick wit, and tactical clarity. Keep voice responses crisp, informative, and engaging."
    ): Result<GeminiResponse> = withContext(Dispatchers.IO) {
        val pool = getCandidateKeys(customFallbackKeys)
        if (pool.isEmpty()) {
            return@withContext Result.failure(
                IllegalStateException("No Gemini API key available. Please add keys in Settings or environment.")
            )
        }

        var lastError: Throwable? = null
        var failedCount = 0

        for ((index, keyEntry) in pool.withIndex()) {
            val (apiKey, label) = keyEntry
            try {
                Log.d("GeminiRepo", "Attempting request with $label...")
                val text = callGeminiApi(apiKey, messages, systemPrompt)
                return@withContext Result.success(
                    GeminiResponse(
                        text = text,
                        keyUsedIndex = index,
                        keyLabel = label,
                        failedAttempts = failedCount
                    )
                )
            } catch (e: Exception) {
                failedCount++
                lastError = e
                Log.w("GeminiRepo", "Key $label failed: ${e.message}. Attempting fallback...")
            }
        }

        Result.failure(lastError ?: Exception("All available Gemini API keys failed."))
    }

    private fun getCandidateKeys(customFallbackKeys: List<String>): List<Pair<String, String>> {
        val list = mutableListOf<Pair<String, String>>()

        fun addIfValid(key: String?, label: String) {
            val trimmed = key?.trim() ?: ""
            if (trimmed.length > 8 && !trimmed.equals("null", ignoreCase = true)) {
                if (list.none { it.first == trimmed }) {
                    list.add(trimmed to label)
                }
            }
        }

        addIfValid(BuildConfig.GEMINI_API_KEY, "Primary Key (Env/Build)")
        addIfValid(BuildConfig.GEMINI_API_KEY_2, "Fallback Key 1 (Env/Build)")
        addIfValid(BuildConfig.GEMINI_API_KEY_3, "Fallback Key 2 (Env/Build)")
        addIfValid(BuildConfig.GEMINI_API_KEY_4, "Fallback Key 3 (Env/Build)")

        customFallbackKeys.forEachIndexed { i, k ->
            addIfValid(k, "User Custom Key #${i + 1}")
        }

        return list
    }

    private fun callGeminiApi(
        apiKey: String,
        messages: List<ChatMessage>,
        systemPrompt: String
    ): String {
        val models = listOf("gemini-2.5-flash", "gemini-1.5-flash", "gemini-flash-latest")
        var lastException: Exception? = null

        for (model in models) {
            val url = "https://generativelanguage.googleapis.com/v1beta/models/$model:generateContent?key=$apiKey"

            val jsonBody = JSONObject().apply {
                val contentsArray = JSONArray()

                // Include conversation history up to last 10 messages
                val recent = messages.takeLast(10)
                for (msg in recent) {
                    val role = if (msg.role == "user") "user" else "model"
                    contentsArray.put(
                        JSONObject().apply {
                            put("role", role)
                            put("parts", JSONArray().put(JSONObject().put("text", msg.content)))
                        }
                    )
                }
                put("contents", contentsArray)

                put("systemInstruction", JSONObject().apply {
                    put("parts", JSONArray().put(JSONObject().put("text", systemPrompt)))
                })

                put("generationConfig", JSONObject().apply {
                    put("temperature", 0.7)
                    put("maxOutputTokens", 1024)
                })
            }

            val request = Request.Builder()
                .url(url)
                .post(jsonBody.toString().toRequestBody(jsonMediaType))
                .header("Content-Type", "application/json")
                .build()

            try {
                client.newCall(request).execute().use { response ->
                    val bodyString = response.body?.string() ?: ""
                    if (!response.isSuccessful) {
                        val isQuotaOrAuth = response.code == 429 || response.code == 401 ||
                                response.code == 403 || bodyString.contains("RESOURCE_EXHAUSTED", ignoreCase = true) ||
                                bodyString.contains("quota", ignoreCase = true)
                        val err = "HTTP ${response.code} ($model): $bodyString"
                        if (isQuotaOrAuth) {
                            throw QuotaExhaustedException(err)
                        } else {
                            throw Exception(err)
                        }
                    }

                    val respJson = JSONObject(bodyString)
                    val candidates = respJson.optJSONArray("candidates")
                    if (candidates != null && candidates.length() > 0) {
                        val contentObj = candidates.getJSONObject(0).optJSONObject("content")
                        val parts = contentObj?.optJSONArray("parts")
                        if (parts != null && parts.length() > 0) {
                            val text = parts.getJSONObject(0).optString("text", "")
                            if (text.isNotBlank()) {
                                return text
                            }
                        }
                    }
                    throw Exception("Empty content received from Gemini model $model")
                }
            } catch (e: QuotaExhaustedException) {
                throw e // Propagate immediately to switch to the next API key
            } catch (e: Exception) {
                lastException = e
            }
        }

        throw lastException ?: Exception("Failed to query Gemini API.")
    }
}

class QuotaExhaustedException(message: String) : Exception(message)
