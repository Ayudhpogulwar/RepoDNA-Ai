package com.codedna.ai.util;

import com.codedna.ai.model.Project;
import com.codedna.ai.model.User;

public class SecurityUtils {
    public static boolean isAuthorized(Project project, User user) {
        if (user == null) return false;
        if ("ROLE_ADMIN".equals(user.getRole())) {
            return true;
        }
        return project.getUser() != null && project.getUser().getId().equals(user.getId());
    }
}
