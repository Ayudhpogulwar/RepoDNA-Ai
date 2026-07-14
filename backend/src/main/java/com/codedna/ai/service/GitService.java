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
        String uniqueDirName = "repo-" + UUID.randomUUID().toString();
        File targetDir = new File(baseUploadDir, uniqueDirName);
        
        if (!targetDir.exists()) {
            Files.createDirectories(targetDir.toPath());
        }

        log.info("Cloning repository {} into {}", gitUrl, targetDir.getAbsolutePath());
        
        try (Git git = Git.cloneRepository()
                .setURI(gitUrl)
                .setDirectory(targetDir)
                .setCloneAllBranches(false)
                .setCloneSubmodules(false)
                .setNoTags()
                .call()) {
            log.info("Successfully cloned {}", gitUrl);
        }
        
        return targetDir;
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
