package com.tasaheel;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class TasaheelApplication {

    public static void main(String[] args) {
        SpringApplication.run(TasaheelApplication.class, args);
    }
}
