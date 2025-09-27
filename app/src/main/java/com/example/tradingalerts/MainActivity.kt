package com.example.tradingalerts

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.messaging.FirebaseMessaging
import com.google.firebase.FirebaseApp

class MainActivity : AppCompatActivity() {

    lateinit var statusTv: TextView
    lateinit var lastMsgTv: TextView
    lateinit var btnCopyToken: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // ✅ Initialize Firebase before anything else
        FirebaseApp.initializeApp(this)

        setContentView(R.layout.activity_main)

        statusTv = findViewById(R.id.tvStatus)
        lastMsgTv = findViewById(R.id.tvLastMsg)
        btnCopyToken = findViewById(R.id.btnCopyToken)

        // Fetch FCM token
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (!task.isSuccessful) {
                statusTv.text = "FCM token fetch failed"
                return@addOnCompleteListener
            }
            val token = task.result
            statusTv.text = "FCM token:\n${token?.take(40)}..."
            btnCopyToken.setOnClickListener {
                val clipboard = getSystemService(CLIPBOARD_SERVICE) as android.content.ClipboardManager
                val clip = android.content.ClipData.newPlainText("fcm-token", token)
                clipboard.setPrimaryClip(clip)
                Toast.makeText(this, "FCM token copied", Toast.LENGTH_SHORT).show()
            }
        }

        // Subscribe to topic
        FirebaseMessaging.getInstance().subscribeToTopic("trading-alerts")

        // Handle message if app opened from notification
        intent?.extras?.let {
            val payload = it.getString("payload")
            if (payload != null) {
                lastMsgTv.text = payload
            }
        }
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        intent?.extras?.let {
            val payload = it.getString("payload")
            if (payload != null) {
                lastMsgTv.text = payload
            }
        }
    }
}
