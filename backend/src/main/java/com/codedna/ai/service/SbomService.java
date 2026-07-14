package com.codedna.ai.service;

import com.codedna.ai.model.Dependency;
import com.codedna.ai.model.Project;
import com.codedna.ai.model.SBOMReport;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
public class SbomService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public SBOMReport generateSbom(Project project, List<Dependency> dependencies, String format) {
        String content;
        if ("SPDX".equalsIgnoreCase(format)) {
            content = generateSpdxJson(project, dependencies);
        } else {
            content = generateCycloneDxJson(project, dependencies);
        }

        return SBOMReport.builder()
                .project(project)
                .format(format.toUpperCase() + "_JSON")
                .content(content)
                .build();
    }

    private String generateSpdxJson(Project project, List<Dependency> dependencies) {
        try {
            ObjectNode root = objectMapper.createObjectNode();
            root.put("spdxVersion", "SPDX-2.3");
            root.put("dataLicense", "CC0-1.0");
            root.put("SPDXID", "SPDXRef-DOCUMENT");
            root.put("name", "CodeDNA-SBOM-" + project.getName().replaceAll("[^a-zA-Z0-9.-]", ""));
            root.put("documentNamespace", "https://codedna.ai/spdx/" + project.getName() + "-" + UUID.randomUUID());

            ObjectNode creationInfo = objectMapper.createObjectNode();
            ArrayNode creators = objectMapper.createArrayNode();
            creators.add("Tool: CodeDNA AI Software Intelligence Platform");
            creationInfo.set("creators", creators);
            creationInfo.put("created", LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME));
            root.set("creationInfo", creationInfo);

            ArrayNode packages = objectMapper.createArrayNode();
            
            // Add primary project package
            ObjectNode projectPkg = objectMapper.createObjectNode();
            projectPkg.put("name", project.getName());
            projectPkg.put("SPDXID", "SPDXRef-Package-Primary");
            projectPkg.put("versionInfo", "1.0.0");
            projectPkg.put("downloadLocation", project.getGitUrl() != null ? project.getGitUrl() : "NONE");
            projectPkg.put("filesAnalyzed", false);
            projectPkg.put("licenseDeclared", "NOASSERTION");
            projectPkg.put("copyrightText", "NOASSERTION");
            packages.add(projectPkg);

            // Add third-party packages
            for (int i = 0; i < dependencies.size(); i++) {
                Dependency dep = dependencies.get(i);
                ObjectNode pkg = objectMapper.createObjectNode();
                pkg.put("name", dep.getName());
                pkg.put("SPDXID", "SPDXRef-Package-Dependency-" + i);
                pkg.put("versionInfo", dep.getVersion());
                pkg.put("downloadLocation", "NOASSERTION");
                pkg.put("filesAnalyzed", false);
                pkg.put("licenseConcluded", dep.getLicense() != null ? dep.getLicense() : "NOASSERTION");
                pkg.put("licenseDeclared", dep.getLicense() != null ? dep.getLicense() : "NOASSERTION");
                pkg.put("copyrightText", "NOASSERTION");
                
                ObjectNode externalRef = objectMapper.createObjectNode();
                externalRef.put("referenceCategory", "PACKAGE-MANAGER");
                externalRef.put("referenceType", dep.getType().toLowerCase());
                externalRef.put("referenceLocator", dep.getName() + "@" + dep.getVersion());
                
                ArrayNode externalRefs = objectMapper.createArrayNode();
                externalRefs.add(externalRef);
                pkg.set("externalRefs", externalRefs);
                
                packages.add(pkg);
            }
            root.set("packages", packages);

            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(root);
        } catch (Exception e) {
            return "{\"error\": \"Failed to generate SPDX: " + e.getMessage() + "\"}";
        }
    }

    private String generateCycloneDxJson(Project project, List<Dependency> dependencies) {
        try {
            ObjectNode root = objectMapper.createObjectNode();
            root.put("bomFormat", "CycloneDX");
            root.put("specVersion", "1.5");
            root.put("serialNumber", "urn:uuid:" + UUID.randomUUID());
            root.put("version", 1);

            ObjectNode metadata = objectMapper.createObjectNode();
            metadata.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME));
            
            ObjectNode tool = objectMapper.createObjectNode();
            tool.put("vendor", "CodeDNA AI");
            tool.put("name", "Analyzer Engine");
            tool.put("version", "1.0.0");
            
            ObjectNode tools = objectMapper.createObjectNode();
            ArrayNode componentsArray = objectMapper.createArrayNode();
            componentsArray.add(tool);
            tools.set("components", componentsArray);
            metadata.set("tools", tools);

            ObjectNode component = objectMapper.createObjectNode();
            component.put("type", "application");
            component.put("name", project.getName());
            component.put("version", "1.0.0");
            metadata.set("component", component);
            root.set("metadata", metadata);

            ArrayNode components = objectMapper.createArrayNode();
            for (Dependency dep : dependencies) {
                ObjectNode comp = objectMapper.createObjectNode();
                comp.put("type", "library");
                comp.put("name", dep.getName());
                comp.put("version", dep.getVersion());
                
                String purl = String.format("pkg:%s/%s@%s", dep.getType().toLowerCase(), dep.getName().replace(":", "/"), dep.getVersion());
                comp.put("purl", purl);

                if (dep.getLicense() != null && !dep.getLicense().equalsIgnoreCase("Unknown")) {
                    ArrayNode licenses = objectMapper.createArrayNode();
                    ObjectNode licWrap = objectMapper.createObjectNode();
                    ObjectNode lic = objectMapper.createObjectNode();
                    lic.put("id", dep.getLicense());
                    licWrap.set("license", lic);
                    licenses.add(licWrap);
                    comp.set("licenses", licenses);
                }

                components.add(comp);
            }
            root.set("components", components);

            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(root);
        } catch (Exception e) {
            return "{\"error\": \"Failed to generate CycloneDX: " + e.getMessage() + "\"}";
        }
    }
}
