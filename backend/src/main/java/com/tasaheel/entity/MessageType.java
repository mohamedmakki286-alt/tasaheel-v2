package com.tasaheel.entity;

public enum MessageType {
    TEXT, IMAGE, AUDIO, FILE;

    public static MessageType fromString(String value) {
        if (value == null) return TEXT;
        try {
            return valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return TEXT;
        }
    }
}
