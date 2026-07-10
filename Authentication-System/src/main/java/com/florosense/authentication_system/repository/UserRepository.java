package com.florosense.authentication_system.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.florosense.authentication_system.entity.Users;

public interface UserRepository extends JpaRepository<Users, Long>
{
	Optional<Users> findByEmail(String email);

	boolean existsByEmail(String email);

}
