package com.codedna.ai.service;

import com.codedna.ai.model.Dependency;
import com.codedna.ai.model.Project;
import com.codedna.ai.model.ProjectFile;
import com.codedna.ai.model.SecurityReport;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class SecurityService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(SecurityService.class);

    private final ObjectMapper objectMapper = new ObjectMapper();

    public static class SecurityIssue {
        public String filePath;
        public int line;
        public String type; // SECRET, SQL_INJECTION, XSS, UNSAFE_FUNCTION, WEAK_CRYPTO, CODE_SMELL
        public String severity; // HIGH, MEDIUM, LOW
        public String description;
        public String recommendation;

        public SecurityIssue(String filePath, int line, String type, String severity, String description, String recommendation) {
            this.filePath = filePath;
            this.line = line;
            this.type = type;
            this.severity = severity;
            this.description = description;
            this.recommendation = recommendation;
        }
    }

    public SecurityReport runScan(Project project, List<ProjectFile> files, List<Dependency> dependencies) {
        List<SecurityIssue> issues = new ArrayList<>();

        // 1. Scan files line by line
        for (ProjectFile file : files) {
            if (file.getContent() == null || file.getContent().isEmpty()) continue;
            scanFileContent(file, issues);
        }

        // 2. Scan dependencies for known vulnerable packages
        scanDependencies(dependencies, issues);

        // 3. Compute score
        int score = calculateSecurityScore(issues, files.size());
        
        String jsonIssues = "[]";
        try {
            jsonIssues = objectMapper.writeValueAsString(issues);
        } catch (Exception e) {
            log.error("Failed to serialize security issues: {}", e.getMessage());
        }

        // 4. Generate recommendations summary
        String recommendations = generateRecommendationsSummary(issues);

        return SecurityReport.builder()
                .project(project)
                .score(score)
                .issuesFound(jsonIssues)
                .recommendations(recommendations)
                .scannedAt(LocalDateTime.now())
                .build();
    }

    private void scanFileContent(ProjectFile file, List<SecurityIssue> issues) {
        String[] lines = file.getContent().split("\n");
        
        // Patterns
        Pattern secretPattern = Pattern.compile("(?i)(api[_-]?key|secret|password|passwd|aws[_-]?key|jwt[_-]?secret|private[_-]?key)\\s*[:=]\\s*\"[a-zA-Z0-9+/=]{16,}\"");
        Pattern sqlInjectionPattern = Pattern.compile("(?i)(select|insert|update|delete).*\\+.*(req|param|user|input|name|id)");
        Pattern xssPattern = Pattern.compile("(?i)(dangerouslySetInnerHTML|innerHTML|document\\.write)");
        Pattern unsafeFuncPattern = Pattern.compile("\\b(eval|exec|system|child_process\\.exec|Runtime\\.getRuntime\\(\\)\\.exec)\\b");
        Pattern weakCryptoPattern = Pattern.compile("\\b(MD5|SHA-1|md5|sha1)\\b");

        for (int i = 0; i < lines.length; i++) {
            String lineContent = lines[i].trim();
            int lineNumber = i + 1;

            // Check hardcoded secrets
            Matcher secretMatcher = secretPattern.matcher(lineContent);
            if (secretMatcher.find() && !lineContent.contains("System.getenv") && !lineContent.contains("${")) {
                issues.add(new SecurityIssue(
                        file.getFilePath(), lineNumber, "SECRET", "HIGH",
                        "Potential hardcoded secret or API credential found.",
                        "Move secrets and keys to environment variables or config files."
                ));
            }

            // Check SQL Injection risks
            Matcher sqlMatcher = sqlInjectionPattern.matcher(lineContent);
            if (sqlMatcher.find()) {
                issues.add(new SecurityIssue(
                        file.getFilePath(), lineNumber, "SQL_INJECTION", "HIGH",
                        "Raw query concatenation detected. Possible SQL injection vulnerability.",
                        "Use prepared statements (e.g. PreparedStatement or JPA parameterized queries) to escape input parameters."
                ));
            }

            // Check XSS
            Matcher xssMatcher = xssPattern.matcher(lineContent);
            if (xssMatcher.find()) {
                issues.add(new SecurityIssue(
                        file.getFilePath(), lineNumber, "XSS", "MEDIUM",
                        "Rendering raw HTML values. Potential Cross-Site Scripting (XSS).",
                        "Use templates that escape variables by default, or implement robust sanitization libraries (e.g. DOMPurify)."
                ));
            }

            // Unsafe functions
            Matcher unsafeMatcher = unsafeFuncPattern.matcher(lineContent);
            if (unsafeMatcher.find()) {
                issues.add(new SecurityIssue(
                        file.getFilePath(), lineNumber, "UNSAFE_FUNCTION", "HIGH",
                        "Execution of unsafe command or dynamic script evaluation ('eval' or shell exec).",
                        "Refactor logic to avoid executing shell commands or eval statement injections."
                ));
            }

            // Weak Crypto
            Matcher weakCryptoMatcher = weakCryptoPattern.matcher(lineContent);
            if (weakCryptoMatcher.find()) {
                issues.add(new SecurityIssue(
                        file.getFilePath(), lineNumber, "WEAK_CRYPTO", "MEDIUM",
                        "Insecure hashing algorithm used (MD5 or SHA-1).",
                        "Upgrade cryptographic functions to secure algorithms like bcrypt, Argon2, or SHA-256/512."
                ));
            }

            // Empty catch block
            if (lineContent.startsWith("catch") && lineContent.contains("{}")) {
                issues.add(new SecurityIssue(
                        file.getFilePath(), lineNumber, "CODE_SMELL", "LOW",
                        "Empty catch block suppresses exceptions without logging.",
                        "Log the exception or rethrow it to prevent silent failures."
                ));
            }
        }

        // File-level checks
        if (lines.length > 500) {
            issues.add(new SecurityIssue(
                    file.getFilePath(), 1, "CODE_SMELL", "LOW",
                    "Large file detected (" + lines.length + " lines). High cognitive load.",
                    "Refactor file into smaller, modular components to improve maintainability."
            ));
        }

        if (file.getComplexity() != null && file.getComplexity() > 20) {
            issues.add(new SecurityIssue(
                    file.getFilePath(), 1, "CODE_SMELL", "LOW",
                    "High cyclomatic complexity score (" + file.getComplexity() + ").",
                    "Simplify control structures and extract nested blocks into standalone helper methods."
            ));
        }
    }

    private void scanDependencies(List<Dependency> dependencies, List<SecurityIssue> issues) {
        Map<String, String> vulnDb = new HashMap<>();
        vulnDb.put("log4j", "CVE-2021-44228: Log4Shell critical RCE vulnerability.");
        vulnDb.put("spring-cloud-function-web", "CVE-2022-22963: Spring Cloud Function RCE.");
        vulnDb.put("axios", "Outdated version has HTTP Request Smuggling CVEs.");
        vulnDb.put("express", "CVE-2024-43799: Express Open Redirect vulnerability.");

        for (Dependency dep : dependencies) {
            for (String key : vulnDb.keySet()) {
                if (dep.getName().toLowerCase().contains(key)) {
                    dep.setVulnerabilityStatus("VULNERABLE");
                    issues.add(new SecurityIssue(
                            "Dependency Manifest", 0, "OUTDATED_PACKAGE", "HIGH",
                            "Vulnerable package: " + dep.getName() + " (" + dep.getVersion() + ") - " + vulnDb.get(key),
                            "Upgrade " + dep.getName() + " to the latest stable secure version."
                    ));
                    break;
                }
            }
        }
    }

    private int calculateSecurityScore(List<SecurityIssue> issues, int totalFiles) {
        if (issues.isEmpty()) return 100;

        long highCount = issues.stream().filter(i -> "HIGH".equals(i.severity)).count();
        long medCount = issues.stream().filter(i -> "MEDIUM".equals(i.severity)).count();
        long lowCount = issues.stream().filter(i -> "LOW".equals(i.severity)).count();

        double weightedIssues = (highCount * 10.0) + (medCount * 4.0) + (lowCount * 1.5);
        double fileScale = Math.max(1.0, Math.sqrt(totalFiles));
        
        int score = (int) Math.round(100.0 - (weightedIssues / fileScale));
        return Math.max(15, Math.min(100, score));
    }

    private String generateRecommendationsSummary(List<SecurityIssue> issues) {
        if (issues.isEmpty()) {
            return "No security concerns identified. Maintain security hygiene by auditing dependencies regularly.";
        }

        long highCount = issues.stream().filter(i -> i.severity.equals("HIGH")).count();
        long medCount = issues.stream().filter(i -> i.severity.equals("MEDIUM")).count();
        long lowCount = issues.stream().filter(i -> i.severity.equals("LOW")).count();

        StringBuilder sb = new StringBuilder();
        sb.append(String.format("Found %d high, %d medium, and %d low-priority security concerns.\n\n", highCount, medCount, lowCount));
        sb.append("### Immediate Actions Required:\n");
        
        issues.stream()
                .filter(i -> i.severity.equals("HIGH"))
                .limit(5)
                .forEach(i -> sb.append(String.format("- **[%s]** In `%s` (Line %d): %s -> *Fix: %s*\n",
                        i.type, i.filePath, i.line, i.description, i.recommendation)));

        if (highCount > 5) {
            sb.append(String.format("- *And %d other high-priority issues...*\n", highCount - 5));
        }

        return sb.toString();
    }
}
