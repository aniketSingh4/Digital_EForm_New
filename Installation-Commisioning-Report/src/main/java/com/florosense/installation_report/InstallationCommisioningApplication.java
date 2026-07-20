package com.florosense.installation_report;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {"com.florosense.installation_report"})
public class InstallationCommisioningApplication 
{

	public static void main(String[] args) 
	{
		SpringApplication.run(InstallationCommisioningApplication.class, args);
	}

}
