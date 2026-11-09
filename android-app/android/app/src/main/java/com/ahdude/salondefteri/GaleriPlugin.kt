package com.ahdude.salondefteri

import android.content.ContentValues
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.Base64
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * Öğün fotoğraflarını galeride "Salon Defteri" albümüne kaydeder.
 * MediaStore üzerinden yazıldığı için Android 10+ izin gerektirmez;
 * uygulama silinse de fotoğraflar galeride kalır.
 */
@CapacitorPlugin(name = "Galeri")
class GaleriPlugin : Plugin() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    /** { veri: base64, tur: "image/jpeg", ad: "ogun_....jpg" } */
    @PluginMethod
    fun kaydet(call: PluginCall) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            call.reject("Albüme kaydetme Android 10 ve üstünde çalışır", "SURUM"); return
        }
        val veri = call.getString("veri") ?: run { call.reject("Fotoğraf yok"); return }
        val tur = call.getString("tur") ?: "image/jpeg"
        val ad = call.getString("ad") ?: "SalonDefteri_${System.currentTimeMillis()}.jpg"
        scope.launch {
            val cozucu = context.contentResolver
            val degerler = ContentValues().apply {
                put(MediaStore.Images.Media.DISPLAY_NAME, ad)
                put(MediaStore.Images.Media.MIME_TYPE, tur)
                put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/Salon Defteri")
                put(MediaStore.Images.Media.IS_PENDING, 1)
            }
            val uri = cozucu.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, degerler)
            if (uri == null) { call.reject("Galeriye yazılamadı"); return@launch }
            try {
                cozucu.openOutputStream(uri)!!.use { it.write(Base64.decode(veri, Base64.DEFAULT)) }
                cozucu.update(uri, ContentValues().apply { put(MediaStore.Images.Media.IS_PENDING, 0) }, null, null)
                call.resolve()
            } catch (e: Exception) {
                cozucu.delete(uri, null, null)
                call.reject(e.message ?: "Galeriye yazılamadı")
            }
        }
    }
}
