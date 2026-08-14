package com.florosense.authentication_system.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.florosense.authentication_system.entity.Users;

public interface UserRepository extends JpaRepository<Users, Long>
{
	Optional<Users> findByEmail(String email);

	Optional<Users> findByEmailIgnoreCase(String email);

	boolean existsByEmail(String email);

	boolean existsByPhone(String phone);

	List<Users> findByRoleIgnoreCase(String role);

	List<Users> findByRoleIgnoreCaseIn(List<String> roles);

}
