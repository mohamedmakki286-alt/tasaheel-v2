package com.tasaheel.integration;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class GoogleMapsService {

    @Value("${application.google.maps.api-key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
    private static final String DISTANCE_MATRIX_URL = "https://maps.googleapis.com/maps/api/distancematrix/json";

    public Map<String, Double> geocode(String address) {
        try {
            String url = GEOCODE_URL + "?address=" + address.replace(" ", "+") + "&key=" + apiKey;
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response != null && "OK".equals(response.get("status"))) {
                var results = (java.util.List<Map<String, Object>>) response.get("results");
                if (results != null && !results.isEmpty()) {
                    var geometry = (Map<String, Object>) results.get(0).get("geometry");
                    var location = (Map<String, Double>) geometry.get("location");
                    return location;
                }
            }
            log.warn("Geocode failed for address: {}", address);
            return null;
        } catch (Exception e) {
            log.error("Geocode error: {}", e.getMessage());
            return null;
        }
    }

    public Map<String, String> reverseGeocode(double lat, double lng) {
        try {
            String url = GEOCODE_URL + "?latlng=" + lat + "," + lng + "&key=" + apiKey;
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response != null && "OK".equals(response.get("status"))) {
                var results = (java.util.List<Map<String, Object>>) response.get("results");
                if (results != null && !results.isEmpty()) {
                    Map<String, String> result = new HashMap<>();
                    result.put("formatted_address", (String) results.get(0).get("formatted_address"));
                    return result;
                }
            }
            log.warn("Reverse geocode failed for: {}, {}", lat, lng);
            return null;
        } catch (Exception e) {
            log.error("Reverse geocode error: {}", e.getMessage());
            return null;
        }
    }

    public Double calculateDistance(double originLat, double originLng, double destLat, double destLng) {
        try {
            String url = DISTANCE_MATRIX_URL
                    + "?origins=" + originLat + "," + originLng
                    + "&destinations=" + destLat + "," + destLng
                    + "&key=" + apiKey;
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response != null && "OK".equals(response.get("status"))) {
                var rows = (java.util.List<Map<String, Object>>) response.get("rows");
                if (rows != null && !rows.isEmpty()) {
                    var elements = (java.util.List<Map<String, Object>>) rows.get(0).get("elements");
                    if (elements != null && !elements.isEmpty()) {
                        var distance = (Map<String, Object>) elements.get(0).get("distance");
                        if (distance != null) {
                            return ((Number) distance.get("value")).doubleValue() / 1000.0;
                        }
                    }
                }
            }
            return null;
        } catch (Exception e) {
            log.error("Distance calculation error: {}", e.getMessage());
            return null;
        }
    }

    public Integer calculateETA(double originLat, double originLng, double destLat, double destLng) {
        try {
            String url = DISTANCE_MATRIX_URL
                    + "?origins=" + originLat + "," + originLng
                    + "&destinations=" + destLat + "," + destLng
                    + "&key=" + apiKey;
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response != null && "OK".equals(response.get("status"))) {
                var rows = (java.util.List<Map<String, Object>>) response.get("rows");
                if (rows != null && !rows.isEmpty()) {
                    var elements = (java.util.List<Map<String, Object>>) rows.get(0).get("elements");
                    if (elements != null && !elements.isEmpty()) {
                        var duration = (Map<String, Object>) elements.get(0).get("duration");
                        if (duration != null) {
                            return ((Number) duration.get("value")).intValue() / 60;
                        }
                    }
                }
            }
            return null;
        } catch (Exception e) {
            log.error("ETA calculation error: {}", e.getMessage());
            return null;
        }
    }
}
