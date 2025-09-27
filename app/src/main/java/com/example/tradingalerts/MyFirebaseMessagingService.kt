package com.example.tradingalerts

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class MyFirebaseMessagingService : FirebaseMessagingService() {

    companion object {
        private const val CHANNEL_ID = "trading_alerts_channel"
        private const val CHANNEL_NAME = "Trading Alerts"
        private const val NOTIF_ID = 1001
        const val EXTRA_PAYLOAD = "payload"          // same key MainActivity expects
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        // Prefer notification payload when present (Android may display it automatically
        // if the app is in background, but we still show a notification to unify behavior).
        val title = remoteMessage.notification?.title
            ?: remoteMessage.data["title"]
            ?: "Trading Alert"

        val body = remoteMessage.notification?.body
            ?: remoteMessage.data["body"]
            ?: remoteMessage.data["value"]
            ?: remoteMessage.data["message"]
            ?: remoteMessage.data.toString()

        showNotification(title, body)
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        // Optionally: send token to your server here
    }

    private fun showNotification(title: String, message: String) {
        createChannelIfNeeded()

        // Intent that opens MainActivity and carries payload
        val intent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            putExtra(EXTRA_PAYLOAD, message)
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or getImmutableFlag()
        )

        val soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_launcher_foreground) // replace with your app icon if you have one
            .setContentTitle(title)
            .setContentText(shorten(message))
            .setStyle(NotificationCompat.BigTextStyle().bigText(message)) // allow longer body
            .setAutoCancel(true)
            .setSound(soundUri)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()

        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.notify(NOTIF_ID, notification)
    }

    private fun shorten(s: String, max: Int = 100): String =
        if (s.length <= max) s else s.take(max - 3) + "..."

    private fun createChannelIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            val channel = nm.getNotificationChannel(CHANNEL_ID)
            if (channel == null) {
                val newChannel = NotificationChannel(
                    CHANNEL_ID,
                    CHANNEL_NAME,
                    NotificationManager.IMPORTANCE_DEFAULT
                )
                newChannel.description = "Notifications for trading alerts"
                nm.createNotificationChannel(newChannel)
            }
        }
    }

    // Helper for PendingIntent immutability flag depending on API level
    private fun getImmutableFlag(): Int {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
    }
}
