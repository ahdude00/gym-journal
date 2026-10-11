package com.ahdude.salondefteri

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import java.util.Calendar

/**
 * Her gece 23:59'da "gün sonu raporu" bildirimi. Raporun kendisi web
 * tarafında (yapay zekâ çağrısı) hazırlanır; uygulama kapalıyken bir web
 * sayfası çalışamadığı için burada yalnızca hatırlatılır. Bildirime
 * dokununca uygulama açılır ve o günün raporunu hazırlar.
 */
object RaporAlarm {
    const val KANAL = "gun_sonu_raporu"
    private const val ISTEK = 2359
    private const val ONAYAR = "rapor_alarm"

    fun kur(context: Context, saat: Int = 23, dakika: Int = 59) {
        context.getSharedPreferences(ONAYAR, Context.MODE_PRIVATE).edit()
            .putInt("saat", saat).putInt("dakika", dakika).putBoolean("acik", true).apply()
        planla(context)
    }

    /** Kayıtlı saate göre bir sonraki alarmı kurar (telefon yeniden başlayınca da çağrılır). */
    fun planla(context: Context) {
        val ayar = context.getSharedPreferences(ONAYAR, Context.MODE_PRIVATE)
        if (!ayar.getBoolean("acik", false)) return
        val c = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, ayar.getInt("saat", 23)); set(Calendar.MINUTE, ayar.getInt("dakika", 59))
            set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
            if (timeInMillis <= System.currentTimeMillis() + 5_000) add(Calendar.DAY_OF_YEAR, 1)
        }
        val am = context.getSystemService(AlarmManager::class.java)
        val pi = PendingIntent.getBroadcast(context, ISTEK, Intent(context, RaporAlarmAlici::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        // Tam zamanlı alarm izni varsa dakikasında, yoksa Android'in izin verdiği en yakın anda.
        if (Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms())
            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, c.timeInMillis, pi)
        else
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, c.timeInMillis, pi)
    }

    fun bildir(context: Context) {
        val nm = context.getSystemService(NotificationManager::class.java)
        if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(KANAL) == null)
            nm.createNotificationChannel(NotificationChannel(KANAL, "Gün sonu raporu", NotificationManager.IMPORTANCE_DEFAULT))
        val ac = Intent(context, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            .putExtra("rapor", true)
        val pi = PendingIntent.getActivity(context, ISTEK, ac, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val b = NotificationCompat.Builder(context, KANAL)
            .setSmallIcon(R.drawable.ic_stat_rapor)
            .setContentTitle("Gün sonu raporun hazır")
            .setContentText("Bugünün beslenme, antrenman ve adımlarının değerlendirmesi için dokun.")
            .setContentIntent(pi).setAutoCancel(true)
        try { NotificationManagerCompat.from(context).notify(ISTEK, b.build()) } catch (_: SecurityException) {}
    }
}

class RaporAlarmAlici : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        RaporAlarm.bildir(context)
        RaporAlarm.planla(context)   // yarın için yeniden kur
    }
}

/** Telefon yeniden başlayınca ya da uygulama güncellenince alarm kaybolur; yeniden kurar. */
class AcilisAlici : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        RaporAlarm.planla(context)
    }
}
