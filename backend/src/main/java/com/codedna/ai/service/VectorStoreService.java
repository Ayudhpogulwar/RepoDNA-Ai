package com.codedna.ai.service;

import com.codedna.ai.model.ProjectFile;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class VectorStoreService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(VectorStoreService.class);

    // Simple Document embedding representation
    public static class EmbeddedDocument {
        public String filePath;
        public float[] vector;
        public String textContent;
        public Set<String> keywords;

        public EmbeddedDocument(String filePath, float[] vector, String textContent, Set<String> keywords) {
            this.filePath = filePath;
            this.vector = vector;
            this.textContent = textContent;
            this.keywords = keywords;
        }
    }

    // In-memory registry representing our FAISS/ChromaDB equivalent
    private final Map<Long, List<EmbeddedDocument>> projectVectorStore = new HashMap<>();

    public void indexProjectFiles(Long projectId, List<ProjectFile> files) {
        List<EmbeddedDocument> docs = new ArrayList<>();
        for (ProjectFile file : files) {
            if (file.getContent() == null || file.getContent().isEmpty()) continue;
            
            // Build simple mock vector based on character frequencies/keywords for fallback RAG
            float[] mockVector = generateMockVector(file.getContent());
            Set<String> keywords = extractKeywords(file.getContent());
            
            docs.add(new EmbeddedDocument(file.getFilePath(), mockVector, file.getContent(), keywords));
        }
        projectVectorStore.put(projectId, docs);
        log.info("Indexed {} files for project ID {}", docs.size(), projectId);
    }

    public List<ProjectFile> queryRelevantFiles(Long projectId, String query, List<ProjectFile> allFiles, int limit) {
        List<EmbeddedDocument> docs = projectVectorStore.get(projectId);
        if (docs == null || docs.isEmpty()) {
            // Fallback: If not indexed, build on the fly
            indexProjectFiles(projectId, allFiles);
            docs = projectVectorStore.get(projectId);
        }

        if (docs == null || docs.isEmpty()) return Collections.emptyList();

        float[] queryVector = generateMockVector(query);
        Set<String> queryKeywords = extractKeywords(query);

        // Compute scores
        Map<EmbeddedDocument, Double> scoredDocs = new HashMap<>();
        for (EmbeddedDocument doc : docs) {
            double cosineSim = cosineSimilarity(queryVector, doc.vector);
            double keywordSim = computeKeywordOverlap(queryKeywords, doc.keywords);
            
            // Hybrid score (60% keyword overlap, 40% cosine similarity on signature)
            double finalScore = (0.6 * keywordSim) + (0.4 * cosineSim);
            scoredDocs.put(doc, finalScore);
        }

        // Sort and retrieve top files
        List<String> topPaths = scoredDocs.entrySet().stream()
                .sorted(Map.Entry.<EmbeddedDocument, Double>comparingByValue().reversed())
                .limit(limit)
                .map(entry -> entry.getKey().filePath)
                .collect(Collectors.toList());

        return allFiles.stream()
                .filter(file -> topPaths.contains(file.getFilePath()))
                .collect(Collectors.toList());
    }

    private float[] generateMockVector(String text) {
        // Create a simple normalized vector of 26 dimensions based on character frequency
        float[] vec = new float[26];
        if (text == null || text.isEmpty()) return vec;

        String clean = text.toLowerCase().replaceAll("[^a-z]", "");
        for (char c : clean.toCharArray()) {
            int idx = c - 'a';
            if (idx >= 0 && idx < 26) {
                vec[idx]++;
            }
        }

        // Normalize
        float sumSquare = 0.0f;
        for (float v : vec) {
            sumSquare += v * v;
        }
        
        float norm = (float) Math.sqrt(sumSquare);
        if (norm > 0) {
            for (int i = 0; i < vec.length; i++) {
                vec[i] /= norm;
            }
        }
        return vec;
    }

    private Set<String> extractKeywords(String text) {
        if (text == null) return Collections.emptySet();
        Set<String> keywords = new HashSet<>();
        String[] tokens = text.toLowerCase().split("[^a-zA-Z0-9_-]");
        for (String token : tokens) {
            if (token.length() > 3 && !isStopword(token)) {
                keywords.add(token);
            }
        }
        return keywords;
    }

    private boolean isStopword(String word) {
        String[] stopwords = {
            "the", "and", "a", "of", "to", "in", "is", "that", "it", "for", 
            "this", "with", "as", "by", "on", "public", "private", "class", 
            "import", "package", "return", "void", "static", "final"
        };
        for (String sw : stopwords) {
            if (sw.equals(word)) return true;
        }
        return false;
    }

    private double computeKeywordOverlap(Set<String> query, Set<String> doc) {
        if (query.isEmpty()) return 0.0;
        long matchCount = query.stream().filter(doc::contains).count();
        return (double) matchCount / query.size();
    }

    private double cosineSimilarity(float[] vectorA, float[] vectorB) {
        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;
        for (int i = 0; i < vectorA.length; i++) {
            dotProduct += vectorA[i] * vectorB[i];
            normA += Math.pow(vectorA[i], 2);
            normB += Math.pow(vectorB[i], 2);
        }
        if (normA == 0.0 || normB == 0.0) return 0.0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
