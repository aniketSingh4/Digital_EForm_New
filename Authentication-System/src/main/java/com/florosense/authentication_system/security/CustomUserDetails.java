package com.florosense.authentication_system.security;

import java.util.Collection;
import java.util.Collections;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.florosense.authentication_system.entity.Users;

public class CustomUserDetails implements UserDetails 
{

	private static final long serialVersionUID = 1L;
	private final Users user;

    public CustomUserDetails(Users user) {
        this.user = user;
    }

    /**
     * Returns the user's role.
     * Example:
     * USER
     * ADMIN
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {

        return Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_" + user.getRole())
        );
    }


    //Returns the encrypted password stored in database.
    @Override
    public String getPassword() 
    {
        return user.getPassword();
    }

    /**
     * Spring calls this method to identify the user.
     * In our application, login is done using email.
     */
    @Override
    public String getUsername() 
    {
        return user.getEmail();
    }

    
    //Is the account expired?
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    
    //Is the account locked?
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    
    //Has the user's password expired?
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    //Is the account enabled?
    @Override
    public boolean isEnabled() {
        return user.isEnabled();
    }


    //Optional: Return the original Users entity if needed.
    public Users getUser() {
        return user;
    }
}