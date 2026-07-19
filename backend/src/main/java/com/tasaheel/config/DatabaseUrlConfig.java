package com.tasaheel.config;

import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.MutablePropertySources;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;

@Configuration
public class DatabaseUrlConfig {

    private final ConfigurableEnvironment env;

    public DatabaseUrlConfig(ConfigurableEnvironment env) {
        this.env = env;
    }

    @PostConstruct
    public void configureDataSource() {
        String databaseUrl = env.getProperty("DATABASE_URL");
        if (databaseUrl != null && !databaseUrl.isBlank()) {
            configureFromRailway(databaseUrl);
        } else {
            normalizeDatabaseUrl();
        }
    }

    private void configureFromRailway(String databaseUrl) {
        try {
            URI uri = new URI(databaseUrl);

            String userInfo = uri.getUserInfo();
            String username = null;
            String password = null;
            if (userInfo != null && userInfo.contains(":")) {
                username = userInfo.split(":", 2)[0];
                password = userInfo.split(":", 2)[1];
            }

            String query = uri.getQuery();
            String jdbcUrl = "jdbc:postgresql://" + uri.getHost() + ":" + uri.getPort() + uri.getPath() + "?sslmode=require" + (query != null ? "&" + query : "");

            Map<String, Object> props = new LinkedHashMap<>();
            props.put("spring.datasource.url", jdbcUrl);
            if (username != null) props.put("spring.datasource.username", username);
            if (password != null) props.put("spring.datasource.password", password);

            MutablePropertySources sources = env.getPropertySources();
            sources.addFirst(new MapPropertySource("railwayDbConfig", props));
        } catch (Exception e) {
            normalizeDatabaseUrl();
        }
    }

    private void normalizeDatabaseUrl() {
        String url = env.getProperty("spring.datasource.url");
        if (url != null && !url.startsWith("jdbc:")) {
            MutablePropertySources sources = env.getPropertySources();
            sources.addFirst(new MapPropertySource("normalizedDbUrl",
                    Map.of("spring.datasource.url", "jdbc:" + url)));
        }
    }
}
