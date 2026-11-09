package com.ahdude.salondefteri;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Yerel eklentiler super.onCreate'ten önce kaydedilmeli.
        registerPlugin(AdimPlugin.class);
        registerPlugin(GaleriPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
