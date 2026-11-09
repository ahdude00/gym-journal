package com.ahdude.salondefteri

import android.Manifest
import android.content.Intent
import android.os.Build
import android.net.Uri
import androidx.activity.result.ActivityResult
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.metadata.DataOrigin
import androidx.health.connect.client.request.AggregateGroupByPeriodRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.PermissionState
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.Period

/**
 * Health Connect'ten günlük adım sayısını okur. Samsung Health adımlarını
 * Health Connect'e aktarır; toplama (aggregate) birden fazla kaynağı
 * (Samsung Health, Google Fit...) çift saymadan birleştirir.
 * Yalnızca okuma izni ister; hiçbir veri yazmaz ve cihazdan çıkarmaz.
 */
@CapacitorPlugin(
    name = "Adim",
    permissions = [Permission(alias = "bildirim", strings = [Manifest.permission.POST_NOTIFICATIONS])]
)
class AdimPlugin : Plugin() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val izinler = setOf(HealthPermission.getReadPermission(StepsRecord::class))

    private fun sdk(): Int = HealthConnectClient.getSdkStatus(context)

    private fun sdkAdi(s: Int) = when (s) {
        HealthConnectClient.SDK_AVAILABLE -> "hazir"
        HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> "guncelleme"
        else -> "yok"
    }

    /** { durum: "hazir" | "guncelleme" | "yok", izin: boolean } */
    @PluginMethod
    fun durum(call: PluginCall) {
        val s = sdk()
        val ret = JSObject().put("durum", sdkAdi(s))
        if (s != HealthConnectClient.SDK_AVAILABLE) {
            call.resolve(ret.put("izin", false)); return
        }
        scope.launch {
            try {
                val verilen = HealthConnectClient.getOrCreate(context).permissionController.getGrantedPermissions()
                call.resolve(ret.put("izin", verilen.containsAll(izinler)))
            } catch (e: Exception) {
                call.reject(e.message ?: "Health Connect okunamadı")
            }
        }
    }

    /** Adım okuma iznini ister. Sonuç: { izin: boolean } */
    @PluginMethod
    fun izinIste(call: PluginCall) {
        if (sdk() != HealthConnectClient.SDK_AVAILABLE) {
            call.reject("Health Connect bu cihazda kullanılamıyor", "HC_YOK"); return
        }
        val intent = PermissionController.createRequestPermissionResultContract().createIntent(context, izinler)
        startActivityForResult(call, intent, "izinSonucu")
    }

    @ActivityCallback
    fun izinSonucu(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        scope.launch {
            try {
                val verilen = HealthConnectClient.getOrCreate(context).permissionController.getGrantedPermissions()
                call.resolve(JSObject().put("izin", verilen.containsAll(izinler)))
            } catch (e: Exception) {
                call.reject(e.message ?: "İzin durumu okunamadı")
            }
        }
    }

    /** Son `gun` günün adımları, eskiden yeniye: { gunler: [{ gun: "2026-10-11", adim: 7840 }] } */
    @PluginMethod
    fun adimlar(call: PluginCall) {
        val gun = (call.getInt("gun") ?: 7).coerceIn(1, 60)
        scope.launch {
            try {
                val bugun = LocalDate.now()
                val bas = bugun.minusDays((gun - 1).toLong())
                val sayilar = gunlukAdim(HealthConnectClient.getOrCreate(context), bas, bugun)
                val dizi = JSArray()
                for (i in 0 until gun) {
                    val g = bas.plusDays(i.toLong())
                    dizi.put(JSObject().put("gun", g.toString()).put("adim", sayilar[g] ?: 0L))
                }
                call.resolve(JSObject().put("gunler", dizi))
            } catch (e: SecurityException) {
                call.reject("Adım okuma izni yok", "IZIN")
            } catch (e: Exception) {
                call.reject(e.message ?: "Adımlar okunamadı")
            }
        }
    }

    /**
     * Günlük adım: her gün için kaynak (uygulama) başına toplam alınır ve en
     * yükseği seçilir. Samsung Health ile Android'in kendi telefon adım sayacı
     * aynı sensörü okuyup Health Connect'e ayrı ayrı yazıyor; Samsung tüm günü
     * tek kayıt yazdığı için tüm kaynakların birlikte aggregate'i bunları
     * ayıklayamıyor ve kabaca iki katını veriyordu.
     *
     * Kayıtlar tek tek okunmuyor, kaynak başına aggregate isteniyor: bir uygulama
     * başlangıcı bitişine eşit bir kayıt yazınca connect-client o kaydı
     * çözerken "startTime must be before endTime" fırlatıyor ve bütün okuma
     * düşüyordu. Aggregate hesabı Health Connect'te yapıldığı için bu kayıtlar
     * okumayı bozmaz.
     */
    private suspend fun gunlukAdim(client: HealthConnectClient, bas: LocalDate, son: LocalDate): Map<LocalDate, Long> =
        kaynakAdim(client, bas, son).mapValues { (_, k) -> k.values.maxOrNull() ?: 0L }

    /** Gün → (kaynak paket adı → adım). */
    private suspend fun kaynakAdim(client: HealthConnectClient, bas: LocalDate, son: LocalDate): Map<LocalDate, Map<String, Long>> {
        val filtre = TimeRangeFilter.between(bas.atStartOfDay(), son.plusDays(1).atStartOfDay())
        fun istek(kaynak: Set<DataOrigin>) = AggregateGroupByPeriodRequest(
            metrics = setOf(StepsRecord.COUNT_TOTAL), timeRangeFilter = filtre,
            timeRangeSlicer = Period.ofDays(1), dataOriginFilter = kaynak)
        val kaynaklar = client.aggregateGroupByPeriod(istek(emptySet())).flatMap { it.result.dataOrigins }.toSet()
        val sonuc = HashMap<LocalDate, HashMap<String, Long>>()
        for (k in kaynaklar) {
            for (g in client.aggregateGroupByPeriod(istek(setOf(k)))) {
                val n = g.result[StepsRecord.COUNT_TOTAL] ?: continue
                sonuc.getOrPut(g.startTime.toLocalDate()) { HashMap() }[k.packageName] = n
            }
        }
        return sonuc
    }

    /** Health Connect ayarlarını (ya da güncelleme gerekiyorsa mağaza sayfasını) açar. */
    @PluginMethod
    fun ayarlariAc(call: PluginCall) {
        val intent = if (sdk() == HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED)
            Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=com.google.android.apps.healthdata"))
        else Intent(HealthConnectClient.ACTION_HEALTH_CONNECT_SETTINGS)
        try {
            activity.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); call.resolve()
        } catch (e: Exception) {
            call.reject("Ayarlar açılamadı")
        }
    }

    /**
     * Sorun giderme: bugünkü adım kayıtlarını tek tek okur, hangi
     * uygulamadan geldiklerini ve toplamlarını döndürür.
     */
    @PluginMethod
    fun tani(call: PluginCall) {
        val s = sdk()
        val ret = JSObject().put("durum", sdkAdi(s)).put("android", Build.VERSION.SDK_INT)
        if (s != HealthConnectClient.SDK_AVAILABLE) { call.resolve(ret); return }
        scope.launch {
            try {
                val client = HealthConnectClient.getOrCreate(context)
                val verilen = client.permissionController.getGrantedPermissions()
                ret.put("izin", verilen.containsAll(izinler))
                if (!verilen.containsAll(izinler)) { call.resolve(ret); return@launch }
                val bugun = LocalDate.now()
                // Toplam ve kaynaklar aggregate'ten: bozuk bir kayıt bunları etkilemez.
                val kaynakBugun = kaynakAdim(client, bugun, bugun)[bugun] ?: emptyMap()
                ret.put("toplam", kaynakBugun.values.maxOrNull() ?: 0L)
                val kaynak = JSObject()
                kaynakBugun.forEach { (k, n) -> kaynak.put(k, n) }
                ret.put("kaynaklar", kaynak)
                try { kayitAyrinti(client, bugun, ret) }
                catch (e: IllegalArgumentException) {
                    // Başlangıcı bitişine eşit bir kayıt: kayıtlar tek tek okunamıyor, toplam yine doğru.
                    ret.put("bozukKayit", e.message ?: "")
                }
                call.resolve(ret)
            } catch (e: Exception) {
                call.resolve(ret.put("hata", e.javaClass.simpleName + ": " + (e.message ?: "")))
            }
        }
    }

    /** Tanılama için bugünkü ve son 7 günün kayıtlarını tek tek okur. */
    private suspend fun kayitAyrinti(client: HealthConnectClient, bugun: LocalDate, ret: JSObject) {
        val aralik = TimeRangeFilter.between(bugun.atStartOfDay(), bugun.plusDays(1).atStartOfDay())
        val kayitlar = client.readRecords(ReadRecordsRequest(StepsRecord::class, aralik)).records
        // Kaynak = uygulama + cihaz: aggregate yalnızca farklı uygulamalar arasında
        // çift saymayı önler; aynı uygulamanın telefon ve saat kayıtları toplanır.
        val kaynak = JSObject()
        kayitlar.groupBy {
            val d = it.metadata.device
            val tur = when (d?.type) { 1 -> "saat"; 2 -> "telefon"; 4 -> "yüzük"; 6 -> "bileklik"; null -> "cihaz yok"; else -> "tür ${d.type}" }
            val model = listOfNotNull(d?.manufacturer, d?.model).joinToString(" ")
            "${it.metadata.dataOrigin.packageName} · $tur" + if (model.isNotEmpty()) " ($model)" else ""
        }.forEach { (k, l) -> kaynak.put(k, l.sumOf { it.count }) }
        ret.put("hamToplam", kayitlar.sumOf { it.count })
        // Zamanca üst üste binen kayıt sayısı (aynı adımların tekrar yazılması)
        var sonBitis = java.time.Instant.MIN
        var cakisan = 0
        for (k in kayitlar.sortedBy { it.startTime }) {
            if (k.startTime < sonBitis) cakisan++
            if (k.endTime > sonBitis) sonBitis = k.endTime
        }
        // Çakışmasız tahmin: her kaydı dakikalarına eşit dağıt, her dakikada en yükseği al
        val dakika = HashMap<Long, Double>()
        kayitlar.forEach {
            val bas = it.startTime.epochSecond / 60
            val n = maxOf(1L, (it.endTime.epochSecond - 1) / 60 - bas + 1)
            val pay = it.count.toDouble() / n
            for (i in 0 until n) dakika.merge(bas + i, pay) { a, b -> maxOf(a, b) }
        }
        ret.put("cakisan", cakisan).put("tekilTahmin", Math.round(dakika.values.sum()))
        // Son 7 günde hiç kayıt var mı (Samsung Health eşitlemesi gecikiyor olabilir)
        val hafta = client.readRecords(ReadRecordsRequest(StepsRecord::class,
            TimeRangeFilter.between(bugun.minusDays(6).atStartOfDay(), bugun.plusDays(1).atStartOfDay()))).records
        ret.put("bugunKayit", kayitlar.size).put("kaynaklar", kaynak)
            .put("haftaKayit", hafta.size)
            .put("sonKayit", hafta.maxByOrNull { it.endTime }?.endTime?.toString())
    }

    /** Her gece verilen saatte gün sonu raporu bildirimi kurar (varsayılan 23:59). */
    @PluginMethod
    fun hatirlaticiKur(call: PluginCall) {
        if (Build.VERSION.SDK_INT >= 33 && getPermissionState("bildirim") != PermissionState.GRANTED) {
            requestPermissionForAlias("bildirim", call, "bildirimSonucu"); return
        }
        alarmKur(call)
    }

    @PermissionCallback
    fun bildirimSonucu(call: PluginCall) { alarmKur(call) }

    private fun alarmKur(call: PluginCall) {
        RaporAlarm.kur(context, call.getInt("saat") ?: 23, call.getInt("dakika") ?: 59)
        val izin = Build.VERSION.SDK_INT < 33 || getPermissionState("bildirim") == PermissionState.GRANTED
        call.resolve(JSObject().put("bildirim", izin))
    }
}
