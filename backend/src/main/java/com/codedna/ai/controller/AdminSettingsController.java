package com.codedna.ai.controller;

import com.codedna.ai.model.SystemSetting;
import com.codedna.ai.model.User;
import com.codedna.ai.repository.SystemSettingRepository;
import com.codedna.ai.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/settings")
public class AdminSettingsController {

    private final SystemSettingRepository systemSettingRepository;
    private final UserRepository userRepository;

    public AdminSettingsController(SystemSettingRepository systemSettingRepository, UserRepository userRepository) {
        this.systemSettingRepository = systemSettingRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> getSettings(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null || !"ROLE_ADMIN".equals(user.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access restricted to Administrators.");
        }

        Map<String, String> response = new HashMap<>();
        
        String geminiKey = systemSettingRepository.findById("gemini_key").map(SystemSetting::getKeyValue).orElse("");
        String openaiKey = systemSettingRepository.findById("openai_key").map(SystemSetting::getKeyValue).orElse("");

        response.put("gemini_key", geminiKey.isEmpty() ? "" : "••••••••••••••••");
        response.put("openai_key", openaiKey.isEmpty() ? "" : "••••••••••••••••");

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<?> saveSettings(@RequestBody Map<String, String> request, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null || !"ROLE_ADMIN".equals(user.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access restricted to Administrators.");
        }

        String geminiKey = request.getOrDefault("gemini_key", "");
        String openaiKey = request.getOrDefault("openai_key", "");

        // Only update if the user entered a new key (not the masked placeholder)
        if (!geminiKey.isEmpty() && !geminiKey.equals("••••••••••••••••")) {
            systemSettingRepository.save(new SystemSetting("gemini_key", geminiKey));
        } else if (geminiKey.isEmpty()) {
            systemSettingRepository.deleteById("gemini_key");
        }

        if (!openaiKey.isEmpty() && !openaiKey.equals("••••••••••••••••")) {
            systemSettingRepository.save(new SystemSetting("openai_key", openaiKey));
        } else if (openaiKey.isEmpty()) {
            systemSettingRepository.deleteById("openai_key");
        }

        return ResponseEntity.ok().body(Map.of("message", "System settings saved successfully!"));
    }
}
