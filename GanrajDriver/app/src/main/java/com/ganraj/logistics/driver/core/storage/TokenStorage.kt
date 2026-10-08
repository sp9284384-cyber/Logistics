package com.ganraj.logistics.driver.core.storage

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.ganraj.logistics.driver.data.model.AuthResponse
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

/** Keeps the JWT in EncryptedSharedPreferences (never in plain preferences). */
@Singleton
class TokenStorage @Inject constructor(@ApplicationContext private val context: Context) {

    private val prefs: SharedPreferences = createPrefs()
    private val _token = MutableStateFlow(prefs.getString(KEY_TOKEN, null))

    /** Emits null when the driver is logged out (including after a 401). */
    val token: StateFlow<String?> = _token.asStateFlow()

    fun getToken(): String? = _token.value
    fun getName(): String? = prefs.getString(KEY_NAME, null)

    fun save(auth: AuthResponse) {
        prefs.edit()
            .putString(KEY_TOKEN, auth.token)
            .putString(KEY_NAME, auth.name)
            .putLong(KEY_USER_ID, auth.userId)
            .apply()
        _token.value = auth.token
    }

    fun clear() {
        prefs.edit().clear().apply()
        _token.value = null
    }

    private fun createPrefs(): SharedPreferences = try {
        open()
    } catch (e: Exception) {
        // Keystore data can become unreadable (restore, OS update). Start clean instead of crashing.
        context.deleteSharedPreferences(FILE)
        open()
    }

    private fun open(): SharedPreferences {
        val key = MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build()
        return EncryptedSharedPreferences.create(
            context, FILE, key,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }

    private companion object {
        const val FILE = "ganraj_secure_prefs"
        const val KEY_TOKEN = "token"
        const val KEY_NAME = "name"
        const val KEY_USER_ID = "user_id"
    }
}
