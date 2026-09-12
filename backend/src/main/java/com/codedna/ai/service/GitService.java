package com.codedna.ai.service;

import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.Comparator;
import java.util.UUID;

@Service
public class GitService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GitService.class);

    @Value("${app.upload.dir}")
    private String baseUploadDir;

    public File cloneRepository(String gitUrl) throws GitAPIException, IOException {
        String url = gitUrl != null ? gitUrl.trim().replaceAll("[\"']", "") : "";
        if (url.isEmpty()) {
            throw romanticGitError("Git URL is required and cannot be empty.");
        }

        String uniqueDirName = "repo-" + UUID.randomUUID().toString();
        File targetDir = new File(baseUploadDir, uniqueDirName);
        
        if (!targetDir.exists()) {
            Files.createDirectories(targetDir.toPath());
        }

        log.info("Cloning repository {} into {}", url, targetDir.getAbsolutePath());
        
        // Attempt 1: JGit
        try (Git git = Git.cloneRepository()
                .setURI(url)
                .setDirectory(targetDir)
                .setCloneAllBranches(false)
                .setCloneSubmodules(false)
                .setNoTags()
                .call()) {
            log.info("Successfully cloned {} via JGit", url);
            return targetDir;
        } catch (Exception jgitEx) {
            log.warn("JGit clone failed for {}: {}. Attempting native git CLI clone fallback...", url, jgitEx.getMessage());
            
            // Attempt 2: Native System Git CLI
            try {
                ProcessBuilder pb = new ProcessBuilder("git", "clone", "--depth", "1", url, targetDir.getAbsolutePath());
                pb.redirectErrorStream(true);
                Process process = pb.start();
                
                String processOutput = new String(process.getInputStream().readAllBytes());
                int exitCode = process.waitFor();
                
                if (exitCode == 0) {
                    log.info("Successfully cloned {} via native git CLI", url);
                    return targetDir;
                } else {
                    String cleanErr = processOutput.trim();
                    log.error("Native git clone failed with exit code {}: {}", exitCode, cleanErr);
                    throw new IOException(cleanErr.isEmpty() ? "Git clone returned exit code " + exitCode : cleanErr);
                }
            } catch (Exception cliEx) {
                log.error("Native git CLI clone failed: {}", cliEx.getMessage());
                throw new IOException("Failed to clone repository: " + jgitEx.getMessage() + " (CLI: " + cliEx.getMessage() + ")");
            }
        }
    }

    private IOException romanticGitError(String message) {
        return new IOException(message);
    }

    public void cleanDirectory(File dir) {
        if (dir == null || !dir.exists()) return;
        try {
            Files.walk(dir.toPath())
                .sorted(Comparator.reverseOrder())
                .map(java.nio.file.Path::toFile)
                .forEach(File::delete);
            log.info("Cleaned directory {}", dir.getAbsolutePath());
        } catch (IOException e) {
            log.warn("Failed to fully clean directory {}: {}", dir.getAbsolutePath(), e.getMessage());
        }
    }
}
