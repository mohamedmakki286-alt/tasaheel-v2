package com.tasaheel.exception;

import org.springframework.context.MessageSource;

import java.util.Locale;

public class ResourceNotFoundException extends RuntimeException {

    private String resource;
    private Long id;
    private String field;
    private String value;

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resource, Long id) {
        super(resource + " not found with id: " + id);
        this.resource = resource;
        this.id = id;
    }

    public ResourceNotFoundException(String resource, String field, String value) {
        super(resource + " not found with " + field + ": " + value);
        this.resource = resource;
        this.field = field;
        this.value = value;
    }

    public String getLocalizedMessage(MessageSource msg, Locale locale) {
        if (resource != null && id != null) {
            return msg.getMessage("error.not.found", new Object[]{resource, id}, locale);
        }
        if (resource != null && field != null && value != null) {
            return msg.getMessage("error.not.found.field", new Object[]{resource, field, value}, locale);
        }
        return msg.getMessage("error.not.found.generic", new Object[]{getMessage()}, locale);
    }
}
