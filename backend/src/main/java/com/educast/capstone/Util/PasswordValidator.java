package com.educast.capstone.Util;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Component
public class PasswordValidator {

    private static final Pattern UPPERCASE = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE = Pattern.compile("[a-z]");
    private static final Pattern DIGIT = Pattern.compile("[0-9]");

    public void validate(String password) {
        List<String> errors = new ArrayList<>();

        if (password.length() < 8) {
            errors.add("Password must be at least 8 characters");
        }
        if (!UPPERCASE.matcher(password).find()) {
            errors.add("Password must contain at least one uppercase letter");
        }
        if (!LOWERCASE.matcher(password).find()) {
            errors.add("Password must contain at least one lowercase letter");
        }
        if (!DIGIT.matcher(password).find()) {
            errors.add("Password must contain at least one digit");
        }

        if (!errors.isEmpty()) {
            throw new IllegalArgumentException(String.join("; ", errors));
        }
    }
}