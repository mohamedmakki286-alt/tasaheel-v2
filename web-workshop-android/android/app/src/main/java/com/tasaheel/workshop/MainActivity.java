package com.tasaheel.workshop;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import java.util.Arrays;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        createNotificationChannels();
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);

            NotificationChannel requestsChannel = new NotificationChannel(
                "workshop-requests",
                "الطلبات",
                NotificationManager.IMPORTANCE_HIGH
            );
            requestsChannel.setDescription("إشعارات الطلبات الجديدة");
            requestsChannel.enableVibration(true);

            NotificationChannel quotesChannel = new NotificationChannel(
                "workshop-quotes",
                "عروض الأسعار",
                NotificationManager.IMPORTANCE_DEFAULT
            );
            quotesChannel.setDescription("إشعارات عروض الأسعار");

            NotificationChannel generalChannel = new NotificationChannel(
                "workshop-general",
                "عام",
                NotificationManager.IMPORTANCE_LOW
            );
            generalChannel.setDescription("إشعارات عامة");

            manager.createNotificationChannels(Arrays.asList(requestsChannel, quotesChannel, generalChannel));
        }
    }
}
