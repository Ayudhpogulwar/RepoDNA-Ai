package com.codedna.ai.service;

import com.codedna.ai.model.Dependency;
import com.codedna.ai.model.Project;
import com.codedna.ai.model.ProjectFile;
import com.codedna.ai.model.SecurityReport;
import com.fasterxml.jackson.databind.ObjectMapper;
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
        public String type;
        public String severity;
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

    // =========================================================
    //  Compiled patterns (static so they're only compiled once)
    // =========================================================

    // --- HIGH severity ---
    private static final Pattern SECRET_PATTERN = Pattern.compile(
        "(?i)(?:api[_-]?key|apikey|secret[_-]?key|client[_-]?secret|auth[_-]?token|access[_-]?token|" +
        "private[_-]?key|aws[_-]?secret|aws[_-]?access|stripe[_-]?key|sendgrid[_-]?key|" +
        "github[_-]?token|slack[_-]?token|telegram[_-]?token|mailgun[_-]?key|" +
        "twilio|firebase|jwt[_-]?secret|db[_-]?pass(?:word)?|database[_-]?pass(?:word)?)" +
        "\\s*[:=]\\s*['\"]([a-zA-Z0-9+/=_\\-]{16,})['\"]"
    );

    private static final Pattern HARDCODED_PASSWORD = Pattern.compile(
        "(?i)(?:password|passwd|pwd)\\s*[:=]\\s*['\"](?!\\$\\{|process\\.env|os\\.getenv|getenv|System\\.getenv)([^'\"\\s]{6,})['\"]"
    );

    private static final Pattern SQL_INJECTION = Pattern.compile(
        "(?i)(?:\"\\s*\\+\\s*(?:req|request|param|user|input|id|name|query|body|data|val|value|search)" +
        "|(?:select|insert|update|delete|drop|alter|exec|execute)\\s+.{0,40}" +
        "(?:\\+|concat|format|%s|\\$\\{|\\$(?:req|param|input|user|name|id)))"
    );

    private static final Pattern UNSAFE_EXEC = Pattern.compile(
        "\\b(?:eval|exec|execSync|spawn|spawnSync|child_process\\.exec|Runtime\\.getRuntime\\(\\)\\.exec|" +
        "ProcessBuilder|os\\.system|subprocess\\.call|subprocess\\.Popen|shell_exec|passthru|" +
        "popen|proc_open|system\\()\\b"
    );

    private static final Pattern PATH_TRAVERSAL = Pattern.compile(
        "(?i)(?:File|Path|FileInputStream|FileOutputStream|new File)\\s*\\(\\s*(?:req|request|param|user|input|name|path|dir|filename)\\b"
    );

    private static final Pattern SSRF_PATTERN = Pattern.compile(
        "(?i)(?:fetch|axios|http\\.get|RestTemplate|OkHttp|requests\\.get|urllib)\\s*\\(\\s*(?:req|request|param|user|input|url|uri|endpoint)\\b"
    );

    private static final Pattern INSECURE_DESERIALIZE = Pattern.compile(
        "(?i)(?:ObjectInputStream|readObject|fromJson\\(.*Object|pickle\\.loads|yaml\\.load\\((?!.*Loader=yaml\\.Safe))" 
    );

    private static final Pattern JWT_NONE_ALG = Pattern.compile(
        "(?i)(?:alg\\s*[=:]\\s*['\"]none['\"]|algorithm\\s*[=:]\\s*['\"]none['\"]|verify\\s*[:=]\\s*false)"
    );

    private static final Pattern OPEN_REDIRECT = Pattern.compile(
        "(?i)(?:redirect|sendRedirect|response\\.redirect|res\\.redirect)\\s*\\(\\s*(?:req|request|param|user|input|url|returnUrl|next|to)\\b"
    );

    // --- MEDIUM severity ---
    private static final Pattern XSS_PATTERN = Pattern.compile(
        "(?i)(?:dangerouslySetInnerHTML|innerHTML\\s*=|document\\.write\\s*\\(|v-html|\\[innerHTML\\]|\\$\\{.*innerHTML\\})"
    );

    private static final Pattern WEAK_CRYPTO = Pattern.compile(
        "\\b(?:MD5|SHA1|SHA-1|md5|sha1|DES|RC4|RC2|Blowfish|des(?:ede)?)\\b"
    );

    private static final Pattern INSECURE_RANDOM = Pattern.compile(
        "\\b(?:Math\\.random\\(\\)|new Random\\(\\)|Random\\s*(?:rand|r)\\s*=\\s*new Random\\(\\))" +
        "(?!.*[Ss]ecure)"
    );

    private static final Pattern CORS_WILDCARD = Pattern.compile(
        "(?i)(?:Access-Control-Allow-Origin['\"]?\\s*[=:]\\s*['\"]?\\*|" +
        "allowedOrigins.*\\*|origins.*allowAll|CorsConfiguration.*setAllowedOrigins.*\\*)"
    );

    private static final Pattern SENSITIVE_LOG = Pattern.compile(
        "(?i)(?:log|logger|console\\.log|System\\.out\\.print)\\s*\\(?.*(?:password|passwd|secret|token|apikey|api_key|credential)[^)]*\\)"
    );

    private static final Pattern HARDCODED_IP = Pattern.compile(
        "(?<![.\\d])(?:\"(?:localhost|127\\.0\\.0\\.1|0\\.0\\.0\\.0|192\\.168\\.|10\\.0\\.|172\\.16\\.)\"|" +
        "(?:http://(?:localhost|127\\.0\\.0\\.1))(?::\\d+)?['\"])"
    );

    private static final Pattern MISSING_INPUT_VALIDATION = Pattern.compile(
        "(?i)(?:@PathVariable|@RequestParam|@RequestBody|req\\.params|req\\.query|req\\.body).*(?!.*(?:@Valid|@Validated|validate|sanitize|strip|escape|trim))"
    );

    private static final Pattern WEAK_BCRYPT_COST = Pattern.compile(
        "(?i)bcrypt.*(?:rounds|cost|salt)\\s*[:=]\\s*(?:[1-9]|10)\\b"
    );

    // --- LOW severity (code smells) ---
    private static final Pattern EMPTY_CATCH = Pattern.compile(
        "(?i)catch\\s*\\([^)]*\\)\\s*\\{\\s*(?://[^\\n]*|/\\*.*?\\*/)?\\s*\\}|" +
        "except\\s*(?:Exception|\\w+)?\\s*(?:as\\s*\\w+)?\\s*:\\s*pass(?:\\s*#[^\\n]*)?"
    );

    private static final Pattern TODO_FIXME = Pattern.compile(
        "(?i)//\\s*(?:TODO|FIXME|HACK|XXX|BUG|SECURITY)\\s*:"
    );

    private static final Pattern PRINT_DEBUG = Pattern.compile(
        "(?i)(?:System\\.out\\.print(?:ln)?|console\\.log|print\\(|println\\()(?!.*test|.*spec)"
    );

    private static final Pattern MAGIC_NUMBER = Pattern.compile(
        "(?<![\\w.])(?:3600|86400|65535|1000|9999|99999|12345|54321)(?![\\w.])"
    );

    // =========================================================
    //  Known vulnerable dependencies (name → version threshold)
    // =========================================================
    private static final Map<String, String[]> VULN_DEP_DB = new LinkedHashMap<>();
    static {
        // format: dep-name-substring → [maxVulnerableVersion, CVE description]
        VULN_DEP_DB.put("log4j",                  new String[]{"2.14.1", "CVE-2021-44228: Log4Shell — Critical RCE via JNDI injection."});
        VULN_DEP_DB.put("log4j-core",              new String[]{"2.14.1", "CVE-2021-44228: Log4Shell — Critical RCE."});
        VULN_DEP_DB.put("spring-cloud-function",   new String[]{"3.2.2",  "CVE-2022-22963: Spring Cloud Function RCE via routing expression."});
        VULN_DEP_DB.put("spring-webmvc",           new String[]{"5.3.17", "CVE-2022-22965: Spring4Shell — RCE via data binding."});
        VULN_DEP_DB.put("spring-framework",        new String[]{"5.3.17", "CVE-2022-22965: Spring4Shell — RCE via data binding."});
        VULN_DEP_DB.put("jackson-databind",        new String[]{"2.13.0", "CVE-2020-36518: Jackson Databind polymorphic deserialization vulnerabilities."});
        VULN_DEP_DB.put("commons-text",            new String[]{"1.9",    "CVE-2022-42889: Text4Shell — RCE via string interpolation."});
        VULN_DEP_DB.put("commons-collections",     new String[]{"3.2.1",  "CVE-2015-7501: Apache Commons Collections deserialization RCE."});
        VULN_DEP_DB.put("struts",                  new String[]{"2.5.30", "CVE-2023-50164: Apache Struts path traversal / RCE."});
        VULN_DEP_DB.put("fastjson",                new String[]{"1.2.83", "CVE-2022-25845: Fastjson remote code execution via auto type."});
        VULN_DEP_DB.put("shiro",                   new String[]{"1.9.0",  "CVE-2023-34478: Apache Shiro authentication bypass."});
        // Node/NPM packages
        VULN_DEP_DB.put("axios",                   new String[]{"1.3.4",  "CVE-2023-45857: Axios CSRF vulnerability exposing auth headers."});
        VULN_DEP_DB.put("express",                 new String[]{"4.18.2", "CVE-2024-43799: Express open redirect vulnerability."});
        VULN_DEP_DB.put("lodash",                  new String[]{"4.17.20","CVE-2021-23337: Lodash prototype pollution / command injection."});
        VULN_DEP_DB.put("moment",                  new String[]{"2.29.3", "CVE-2022-24785: Moment.js path traversal vulnerability."});
        VULN_DEP_DB.put("node-fetch",              new String[]{"2.6.6",  "CVE-2022-0235: node-fetch Redirect to non-HTTP(S) protocol."});
        VULN_DEP_DB.put("jsonwebtoken",            new String[]{"8.5.1",  "CVE-2022-23529: jsonwebtoken secret injection vulnerability."});
        VULN_DEP_DB.put("tar",                     new String[]{"6.1.11", "CVE-2021-37701: tar path traversal allowing overwrite."});
        VULN_DEP_DB.put("semver",                  new String[]{"7.3.8",  "CVE-2022-25883: semver ReDoS vulnerability."});
        VULN_DEP_DB.put("vm2",                     new String[]{"3.9.17", "CVE-2023-29017: vm2 sandbox escape allowing RCE."});
        // Python packages
        VULN_DEP_DB.put("pillow",                  new String[]{"9.3.0",  "CVE-2023-44271: Pillow DoS/RCE via crafted image."});
        VULN_DEP_DB.put("requests",                new String[]{"2.27.1", "CVE-2023-32681: requests leaks Proxy-Authorization header on redirect."});
        VULN_DEP_DB.put("django",                  new String[]{"4.1.9",  "CVE-2023-41164: Django ReDoS vulnerability in EmailValidator."});
        VULN_DEP_DB.put("flask",                   new String[]{"2.2.5",  "CVE-2023-30861: Flask session cookie not revoked after logout."});
        VULN_DEP_DB.put("cryptography",            new String[]{"41.0.2", "CVE-2023-38325: cryptography Bleichenbacher timing attack."});
        VULN_DEP_DB.put("pyyaml",                  new String[]{"5.4.0",  "CVE-2020-14343: PyYAML unsafe yaml.load() allows arbitrary code execution."});
        VULN_DEP_DB.put("paramiko",                new String[]{"2.12.0", "CVE-2022-24302: Paramiko PRNG weak key generation."});
        VULN_DEP_DB.put("urllib3",                 new String[]{"1.26.14","CVE-2023-45803: urllib3 header injection via multipart boundaries."});
        VULN_DEP_DB.put("sqlalchemy",              new String[]{"1.4.46", "CVE-2023-30531: SQLAlchemy SQL injection via column/table names."});
        VULN_DEP_DB.put("celery",                  new String[]{"5.2.7",  "CVE-2021-23727: Celery task result backend allows stored XSS."});
    }

    public SecurityReport runScan(Project project, List<ProjectFile> files, List<Dependency> dependencies) {
        List<SecurityIssue> issues = new ArrayList<>();

        for (ProjectFile file : files) {
            if (file.getContent() == null || file.getContent().isEmpty()) continue;
            // Skip non-source files
            String ext = file.getExtension() != null ? file.getExtension().toLowerCase() : "";
            if (ext.equals("png") || ext.equals("jpg") || ext.equals("gif") || ext.equals("ico") ||
                ext.equals("woff") || ext.equals("ttf") || ext.equals("eot") || ext.equals("svg") ||
                ext.equals("lock") || ext.equals("min.js") || ext.equals("map")) continue;
            scanFileContent(file, issues);
        }

        scanDependencies(dependencies, issues);

        int score = calculateSecurityScore(issues, files.size());

        String jsonIssues = "[]";
        try {
            jsonIssues = objectMapper.writeValueAsString(issues);
        } catch (Exception e) {
            log.error("Failed to serialize security issues: {}", e.getMessage());
        }

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
        String content = file.getContent();
        String[] lines = content.split("\n");
        String filePath = file.getFilePath();

        // Deduplicate issues within the same file+type to avoid floods
        Set<String> seenKeys = new HashSet<>();

        for (int i = 0; i < lines.length; i++) {
            String raw = lines[i];
            String line = raw.trim();
            int lineNum = i + 1;

            if (line.isEmpty() || line.startsWith("//") || line.startsWith("*") || line.startsWith("#") && !line.startsWith("#!")) {
                // Still scan comment-prefixed lines for TODO/FIXME
                checkPattern(TODO_FIXME, raw, filePath, lineNum, "TODO_FIXME", "LOW",
                    "Security/quality TODO or FIXME marker left in production code.",
                    "Resolve the flagged issue before merging to production branches.", issues, seenKeys);
                continue;
            }

            // ── HIGH ──────────────────────────────────────────────
            checkPattern(SECRET_PATTERN, line, filePath, lineNum, "HARDCODED_SECRET", "HIGH",
                "Hardcoded API key or secret credential detected in source code.",
                "Move secrets to environment variables (.env) or a secrets manager (Vault, AWS SSM).", issues, seenKeys);

            checkPattern(HARDCODED_PASSWORD, line, filePath, lineNum, "HARDCODED_PASSWORD", "HIGH",
                "Hardcoded password value found in source code.",
                "Never embed passwords in source. Use environment variables or encrypted credential stores.", issues, seenKeys);

            checkPattern(SQL_INJECTION, line, filePath, lineNum, "SQL_INJECTION", "HIGH",
                "String concatenation used in SQL/DB query — possible SQL injection vulnerability.",
                "Use parameterized queries, PreparedStatement, or ORM query builders (JPA Criteria, Sequelize).", issues, seenKeys);

            checkPattern(UNSAFE_EXEC, line, filePath, lineNum, "COMMAND_INJECTION", "HIGH",
                "Unsafe system command execution or eval() detected.",
                "Avoid shell exec functions with user input. Use safe API alternatives and strict input validation.", issues, seenKeys);

            checkPattern(PATH_TRAVERSAL, line, filePath, lineNum, "PATH_TRAVERSAL", "HIGH",
                "File path constructed from user-controlled input — risk of directory traversal attack.",
                "Canonicalize paths using Files.toRealPath() and validate they are within expected base directory.", issues, seenKeys);

            checkPattern(SSRF_PATTERN, line, filePath, lineNum, "SSRF", "HIGH",
                "HTTP request made with user-controlled URL — potential Server-Side Request Forgery (SSRF).",
                "Validate and whitelist allowed domains. Block requests to internal networks (169.254.x.x, 127.x.x.x).", issues, seenKeys);

            checkPattern(INSECURE_DESERIALIZE, line, filePath, lineNum, "INSECURE_DESERIALIZATION", "HIGH",
                "Insecure deserialization of untrusted data detected.",
                "Use SafeConstructor for YAML, validate object types before deserialization, or switch to JSON.", issues, seenKeys);

            checkPattern(JWT_NONE_ALG, line, filePath, lineNum, "JWT_INSECURE", "HIGH",
                "JWT configured with 'none' algorithm or signature verification disabled.",
                "Always enforce algorithm (e.g. HS256/RS256). Reject tokens with alg=none.", issues, seenKeys);

            checkPattern(OPEN_REDIRECT, line, filePath, lineNum, "OPEN_REDIRECT", "HIGH",
                "Redirect target based on user-supplied input — possible open redirect attack.",
                "Validate redirect URLs against an allow-list of internal paths; reject absolute external URLs.", issues, seenKeys);

            // ── MEDIUM ──────────────────────────────────────────────
            checkPattern(XSS_PATTERN, line, filePath, lineNum, "XSS", "MEDIUM",
                "Raw HTML injection via dangerouslySetInnerHTML or innerHTML — Cross-Site Scripting risk.",
                "Sanitize HTML content with DOMPurify before rendering, or use template escaping instead.", issues, seenKeys);

            checkPattern(WEAK_CRYPTO, line, filePath, lineNum, "WEAK_CRYPTO", "MEDIUM",
                "Weak or broken cryptographic algorithm (MD5/SHA-1/DES/RC4) detected.",
                "Replace with bcrypt, Argon2 for passwords, or AES-256/SHA-256 for general hashing.", issues, seenKeys);

            checkPattern(INSECURE_RANDOM, line, filePath, lineNum, "INSECURE_RANDOM", "MEDIUM",
                "Non-cryptographic random number generator used — predictable values in security context.",
                "Use SecureRandom (Java), crypto.randomBytes() (Node.js), or secrets.token_hex() (Python).", issues, seenKeys);

            checkPattern(CORS_WILDCARD, line, filePath, lineNum, "CORS_MISCONFIGURATION", "MEDIUM",
                "CORS policy allows all origins (*) — exposes API to cross-origin attacks.",
                "Restrict allowed origins to specific trusted domains instead of using wildcard.", issues, seenKeys);

            checkPattern(SENSITIVE_LOG, line, filePath, lineNum, "SENSITIVE_DATA_LOG", "MEDIUM",
                "Password, token, or secret possibly being logged to console/file.",
                "Never log credentials. Mask or exclude sensitive fields from log output.", issues, seenKeys);

            checkPattern(WEAK_BCRYPT_COST, line, filePath, lineNum, "WEAK_BCRYPT", "MEDIUM",
                "BCrypt cost factor is very low (< 12) — brute-force cracking is feasible.",
                "Increase bcrypt work factor to at least 12. Higher is slower but more secure.", issues, seenKeys);

            // ── LOW ──────────────────────────────────────────────
            checkPattern(EMPTY_CATCH, line, filePath, lineNum, "EMPTY_CATCH", "LOW",
                "Empty or pass-only exception handler silently swallows errors.",
                "Log the exception or rethrow it to avoid masking failures.", issues, seenKeys);

            checkPattern(PRINT_DEBUG, line, filePath, lineNum, "DEBUG_STATEMENT", "LOW",
                "Debug print/console.log statement left in production code.",
                "Remove or replace debug statements with proper structured logging (SLF4J, Winston, Loguru).", issues, seenKeys);

            checkPattern(MAGIC_NUMBER, line, filePath, lineNum, "MAGIC_NUMBER", "LOW",
                "Magic number constant used directly in code — reduces readability and configurability.",
                "Extract magic numbers into named constants or configuration values.", issues, seenKeys);

            checkPattern(HARDCODED_IP, line, filePath, lineNum, "HARDCODED_ADDRESS", "LOW",
                "Hardcoded IP address or localhost URL detected.",
                "Use configuration/environment variables for all host addresses and ports.", issues, seenKeys);
        }

        // ── File-level checks ──────────────────────────────────
        if (lines.length > 500) {
            issues.add(new SecurityIssue(filePath, 1, "CODE_SMELL", "LOW",
                "Large file: " + lines.length + " lines — high cognitive complexity.",
                "Refactor into smaller, single-responsibility modules."));
        }

        if (file.getComplexity() != null && file.getComplexity() > 20) {
            issues.add(new SecurityIssue(filePath, 1, "HIGH_COMPLEXITY", "LOW",
                "Cyclomatic complexity score " + file.getComplexity() + " — hard to test and review.",
                "Break down complex methods; aim for complexity ≤ 10 per function."));
        }

        // Check for TODO FIXME in full content (multi-line pass)
        Matcher todoMatcher = TODO_FIXME.matcher(content);
        int todoCount = 0;
        while (todoMatcher.find() && todoCount < 5) {
            int lineNum = countLines(content, todoMatcher.start());
            String key = "TODO_FIXME:" + lineNum;
            if (!seenKeys.contains(key)) {
                seenKeys.add(key);
                issues.add(new SecurityIssue(filePath, lineNum, "TODO_FIXME", "LOW",
                    "Unresolved security/quality TODO or FIXME marker in source code.",
                    "Fix or remove before merging to production."));
                todoCount++;
            }
        }
    }

    private void checkPattern(Pattern pattern, String line, String filePath, int lineNum,
                              String type, String severity, String description, String recommendation,
                              List<SecurityIssue> issues, Set<String> seenKeys) {
        // Deduplicate: same file+type+line-block (within 10 lines)
        String key = type + ":" + (lineNum / 10);
        if (seenKeys.contains(key)) return;
        Matcher m = pattern.matcher(line);
        if (m.find()) {
            seenKeys.add(key);
            // Extra filter: skip test files for low-severity items
            if (severity.equals("LOW") && (filePath.contains("test") || filePath.contains("spec") || filePath.contains("__tests__"))) return;
            issues.add(new SecurityIssue(filePath, lineNum, type, severity, description, recommendation));
        }
    }

    private int countLines(String content, int offset) {
        int count = 1;
        for (int i = 0; i < offset && i < content.length(); i++) {
            if (content.charAt(i) == '\n') count++;
        }
        return count;
    }

    // =========================================================
    //  Dependency vulnerability scanning with version comparison
    // =========================================================
    private void scanDependencies(List<Dependency> dependencies, List<SecurityIssue> issues) {
        for (Dependency dep : dependencies) {
            String depName = dep.getName().toLowerCase();

            for (Map.Entry<String, String[]> entry : VULN_DEP_DB.entrySet()) {
                if (depName.contains(entry.getKey())) {
                    String maxVulnVersion = entry.getValue()[0];
                    String cveDescription = entry.getValue()[1];
                    String depVersion = dep.getVersion();

                    boolean isVulnerable = isVersionVulnerable(depVersion, maxVulnVersion);
                    if (isVulnerable || depVersion == null || depVersion.equalsIgnoreCase("LATEST")) {
                        dep.setVulnerabilityStatus("VULNERABLE");
                        issues.add(new SecurityIssue(
                            "Dependency Manifest", 0, "OUTDATED_PACKAGE", "HIGH",
                            "Vulnerable dependency: " + dep.getName() + " v" + depVersion + " — " + cveDescription,
                            "Upgrade " + dep.getName() + " to a version above " + maxVulnVersion + " immediately."
                        ));
                    } else {
                        // Known package, version is fine — mark as OUTDATED if older than threshold
                        if (dep.getVulnerabilityStatus() == null || dep.getVulnerabilityStatus().equals("SECURE")) {
                            dep.setVulnerabilityStatus("OUTDATED");
                        }
                    }
                    break;
                }
            }
        }

        // Flag very old version strings
        for (Dependency dep : dependencies) {
            String ver = dep.getVersion();
            if (ver != null && (ver.startsWith("0.") || ver.startsWith("1.0") || ver.startsWith("1.1"))) {
                if (!"VULNERABLE".equals(dep.getVulnerabilityStatus())) {
                    dep.setVulnerabilityStatus("OUTDATED");
                    issues.add(new SecurityIssue(
                        "Dependency Manifest", 0, "OUTDATED_PACKAGE", "MEDIUM",
                        "Potentially outdated package: " + dep.getName() + " v" + ver + " — early major version may lack security patches.",
                        "Review and upgrade " + dep.getName() + " to a current stable release."
                    ));
                }
            }
        }
    }

    /**
     * Simple semver comparison: returns true if depVersion <= maxVulnVersion.
     * Falls back to string comparison for non-standard version strings.
     */
    private boolean isVersionVulnerable(String depVersion, String maxVulnVersion) {
        if (depVersion == null || depVersion.isEmpty() || depVersion.equalsIgnoreCase("LATEST")) return true;
        try {
            int[] dep = parseVersion(depVersion);
            int[] max = parseVersion(maxVulnVersion);
            for (int i = 0; i < Math.max(dep.length, max.length); i++) {
                int d = i < dep.length ? dep[i] : 0;
                int m = i < max.length ? max[i] : 0;
                if (d < m) return true;
                if (d > m) return false;
            }
            return true; // equal → also vulnerable
        } catch (Exception e) {
            return false;
        }
    }

    private int[] parseVersion(String version) {
        String cleaned = version.replaceAll("[^0-9.]", "");
        String[] parts = cleaned.split("\\.");
        int[] result = new int[parts.length];
        for (int i = 0; i < parts.length; i++) {
            try { result[i] = Integer.parseInt(parts[i]); } catch (NumberFormatException e) { result[i] = 0; }
        }
        return result;
    }

    // =========================================================
    //  Score + recommendations
    // =========================================================
    private int calculateSecurityScore(List<SecurityIssue> issues, int totalFiles) {
        if (issues.isEmpty()) return 100;

        long highCount = issues.stream().filter(i -> "HIGH".equals(i.severity)).count();
        long medCount  = issues.stream().filter(i -> "MEDIUM".equals(i.severity)).count();
        long lowCount  = issues.stream().filter(i -> "LOW".equals(i.severity)).count();

        double weightedIssues = (highCount * 12.0) + (medCount * 5.0) + (lowCount * 1.5);
        double fileScale = Math.max(1.0, Math.sqrt(Math.max(totalFiles, 1)));

        int score = (int) Math.round(100.0 - (weightedIssues / fileScale));
        return Math.max(10, Math.min(100, score));
    }

    private String generateRecommendationsSummary(List<SecurityIssue> issues) {
        if (issues.isEmpty()) {
            return "✅ No critical security concerns identified. Maintain hygiene by auditing dependencies regularly and scanning before each release.";
        }

        long highCount = issues.stream().filter(i -> "HIGH".equals(i.severity)).count();
        long medCount  = issues.stream().filter(i -> "MEDIUM".equals(i.severity)).count();
        long lowCount  = issues.stream().filter(i -> "LOW".equals(i.severity)).count();

        StringBuilder sb = new StringBuilder();
        sb.append(String.format("⚠️ Scan found **%d critical**, **%d medium**, and **%d low** issues.\n\n", highCount, medCount, lowCount));

        if (highCount > 0) {
            sb.append("### 🔴 Immediate Actions (HIGH priority):\n");
            issues.stream().filter(i -> "HIGH".equals(i.severity)).limit(6)
                .forEach(i -> sb.append(String.format("- **[%s]** `%s` (L%d): %s → *%s*\n",
                    i.type, i.filePath, i.line, i.description, i.recommendation)));
            if (highCount > 6) sb.append(String.format("- *...and %d more HIGH issues.*\n", highCount - 6));
        }

        if (medCount > 0) {
            sb.append("\n### 🟡 Review Soon (MEDIUM priority):\n");
            issues.stream().filter(i -> "MEDIUM".equals(i.severity)).limit(4)
                .forEach(i -> sb.append(String.format("- **[%s]** `%s`: %s\n",
                    i.type, i.filePath, i.description)));
            if (medCount > 4) sb.append(String.format("- *...and %d more MEDIUM issues.*\n", medCount - 4));
        }

        sb.append("\n### 🔵 General Recommendations:\n");
        sb.append("- Run SAST tools (SonarQube, Semgrep) in your CI/CD pipeline.\n");
        sb.append("- Keep all dependencies up to date with Dependabot or Renovate.\n");
        sb.append("- Enforce secret scanning with git-secrets or GitHub Advanced Security.\n");
        sb.append("- Review OWASP Top 10 for your framework/language stack.\n");

        return sb.toString();
    }
}
