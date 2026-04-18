package com.loanguard.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

	// RestTemplate is used by FraudDetectionService to call Python Flask API
    // We register it as a Bean so Spring can inject it anywhere with @Autowired
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

}
