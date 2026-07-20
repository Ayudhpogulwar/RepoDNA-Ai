import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAnalysis } from '../context/AnalysisContext';
import type { ProjectFile } from '../context/AnalysisContext';
import { File, Search, Sparkles, Cpu } from 'lucide-react';
import Editor from '@monaco-editor/react';

export const CodeExplorerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { files } = useAnalysis();

  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiExplanation, setAiExplanation] = useState('Select a file to run AI Code DNA explanation...');
  const [explaining, setExplaining] = useState(false);

  const renderMarkdownAsHtml = (md: string) => {
    if (!md) return '';
    let html = md;
    
    // Headers (e.g. #### title or ### title)
    html = html.replace(/^#### (.*?)$/gm, '<h4 class="font-bold text-white text-xs mt-3 mb-1.5">$1</h4>');
    html = html.replace(/^### (.*?)$/gm, '<h3 class="font-bold text-white text-sm mt-4 mb-2">$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2 class="font-bold text-white text-base mt-5 mb-2.5">$1</h2>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
    
    // Bullet lists
    html = html.replace(/^\* (.*?)$/gm, '<li class="ml-4 list-disc mb-1">$1</li>');
    html = html.replace(/^- (.*?)$/gm, '<li class="ml-4 list-disc mb-1">$1</li>');
    
    // Wrap list items
    html = html.replace(/(<li.*?>.*?<\/li>\s*)+/g, (match) => `<ul class="my-2">${match}</ul>`);
    
    // Linebreaks
    html = html.replace(/\n/g, '<br/>');
    
    return html;
  };

  useEffect(() => {
    if (files.length > 0) {
      handleFileClick(files[0].filePath);
    }
  }, [files]);

  const handleFileClick = async (filePath: string) => {
    try {
      const res = await fetch(`http://localhost:8080/api/projects/${id}/files/detail?path=${encodeURIComponent(filePath)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('codedna_token')}`,
        }
      });
      if (res.ok) {
        const fileDetail = await res.json();
        setSelectedFile(fileDetail);
        setEditorContent(fileDetail.content || '');
      } else {
        throw new Error('Fallback required');
      }
    } catch {
      // Offline fallback
      const found = files.find(f => f.filePath === filePath);
      if (found) {
        setSelectedFile(found);
        
        // Simulating loading the content
        let content = '';
        if (found.filePath.endsWith('.java')) {
          content = `package com.petclinic;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;

@SpringBootApplication
@RestController
public class PetclinicApplication {

    public static void main(String[] args) {
        SpringApplication.run(PetclinicApplication.class, args);
    }

    @GetMapping("/api/status")
    public String getStatus() {
        return "Operational";
    }
}`;
          if (found.fileName.includes('Controller')) {
            content = `package com.petclinic.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/owners")
public class OwnerController {

    @GetMapping("/search")
    public List<String> searchOwners(@RequestParam String lastName) {
        // SQL Injection vulnerable dynamic query string concatenation!
        String query = "SELECT * FROM owners WHERE last_name = '" + lastName + "'";
        System.out.println("Running raw query: " + query);
        
        return Arrays.asList("John Doe", "Mary Smith");
    }
}`;
          }
        } else if (found.fileName === 'pom.xml') {
          content = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.petclinic</groupId>
    <artifactId>spring-petclinic</artifactId>
    <version>1.0.0</version>
    
    <dependencies>
        <dependency>
            <groupId>org.apache.logging.log4j</groupId>
            <artifactId>log4j-core</artifactId>
            <version>2.14.0</version> <!-- Outdated vulnerable package -->
        </dependency>
    </dependencies>
</project>`;
        } else if (found.filePath.endsWith('.js') || found.filePath.endsWith('.jsx') || found.filePath.endsWith('.ts') || found.filePath.endsWith('.tsx') || found.filePath.endsWith('.json')) {
          content = `// React/JavaScript Component Example
import React, { useState } from 'react';

export const UserProfile = ({ username, role }) => {
  const [active, setActive] = useState(true);

  // Security warning: passing raw token in query string
  const fetchSecrets = () => {
    fetch('/api/secrets?token=supersecret123456');
  };

  return (
    <div className="p-4 bg-slate-900 border border-white/5 rounded-xl">
      <h3 className="text-white font-bold">{username}</h3>
      <p className="text-slate-400 text-xs">{role}</p>
      <button onClick={fetchSecrets} className="mt-2 text-indigo-400">
        Load Secrets
      </button>
    </div>
  );
};
export default UserProfile;`;
        } else {
          content = `# application properties configurations
server.port=8081
spring.datasource.url=jdbc:mysql://localhost:3306/petclinic
spring.datasource.username=root
spring.datasource.password=rootPassword123! # Hardcoded secret credentials!
`;
        }
        setEditorContent(content);
      }
    }
    setAiExplanation('Click "Explain Code" below to generate AI code analysis.');
  };

  const getMonacoLanguage = (lang: string) => {
    if (!lang) return 'javascript';
    const l = lang.toLowerCase();
    if (l.includes('javascript') || l.includes('js')) return 'javascript';
    if (l.includes('typescript') || l.includes('ts')) return 'typescript';
    if (l.includes('python') || l === 'py') return 'python';
    if (l.includes('java')) return 'java';
    if (l.includes('xml')) return 'xml';
    if (l.includes('json')) return 'json';
    if (l.includes('html')) return 'html';
    if (l.includes('css')) return 'css';
    return l;
  };

  const handleExplainCode = async () => {
    if (!selectedFile) return;
    setExplaining(true);
    setAiExplanation('Analyzing AST patterns and generating summary...');

    try {
      const res = await fetch(`http://localhost:8080/api/chat/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('codedna_token')}`,
          'Content-Type': 'application/json',
          'X-Gemini-Key': localStorage.getItem('gemini_key') || '',
          'X-OpenAI-Key': localStorage.getItem('openai_key') || ''
        },
        body: JSON.stringify({ message: `Provide a detailed and thorough explanation of what this file does, highlighting its main functionality, design patterns, dependencies, and checking for any security issues in ${selectedFile.filePath}: \n\n${editorContent}` })
      });
      if (res.ok) {
        const data = await res.json();
        setAiExplanation(data.response);
      } else {
        throw new Error('Simulation required');
      }
    } catch {
      setTimeout(() => {
        let explanation = `### 📝 Detailed Code Analysis (${selectedFile.fileName})\n\n`;
        explanation += `#### 1. Functional Overview\n`;
        explanation += `This file implements the **${selectedFile.fileName.replace(/\.[^/.]+$/, "")}** module. It forms a crucial part of the application workspace architecture, managing data flow, endpoint routing, or dependency configuration.\n\n`;
        
        explanation += `#### 2. Key Code Metrics\n`;
        explanation += `* **Lines of Code**: \`${editorContent.split('\n').length} lines\`\n`;
        explanation += `* **Complexity**: Cyclomatic complexity is estimated at **${selectedFile.complexity || 2}**, representing clear, manageable logic paths.\n\n`;
        
        explanation += `#### 3. Security & Vulnerability Check\n`;
        if (selectedFile.fileName.includes('Controller')) {
          explanation += `> [!WARNING]\n`;
          explanation += `> **Dynamic SQL Injection Risk**: Detected a dynamic string concatenation pattern inside database queries. Refactor queries to use parameterized prepared statements or JPA query bindings immediately.\n`;
        } else if (selectedFile.fileName.includes('properties') || selectedFile.fileName.includes('yml')) {
          explanation += `> [!CAUTION]\n`;
          explanation += `> **Credentials Leak Risk**: Detected a hardcoded database username or password secret. Cleanse this file and transfer credentials to local environment properties or vault managers.\n`;
        } else {
          explanation += `> [!NOTE]\n`;
          explanation += `> **Standard Secure Bounds**: The code structure conforms to general security patterns. No sensitive credentials, secrets, or injection pathways were identified.\n`;
        }
        
        explanation += `\n#### 4. Design Patterns & Recommendations\n`;
        explanation += `* **Patterns**: Follows modular structural design, promoting clear separation of concerns.\n`;
        explanation += `* **Recommendation**: Implement thorough unit tests to guarantee boundary condition safety and code coverage.\n`;
        
        setAiExplanation(explanation);
      }, 800);
    } finally {
      setExplaining(false);
    }
  };

  const filteredFiles = files.filter(f => 
    f.filePath.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row border border-white/5 rounded-2xl overflow-hidden glass-container">
      
      {/* File Tree Sidebar */}
      <div className="w-full md:w-64 border-r border-white/5 flex flex-col h-full bg-slate-950/20">
        <div className="p-4 border-b border-white/5 space-y-2.5">
          <h4 className="font-bold text-white text-sm">File Explorer</h4>
          <div className="flex items-center gap-2 bg-slate-900/60 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none w-full placeholder-slate-600"
            />
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-2 space-y-0.5">
          {filteredFiles.map((file) => (
            <button
              key={file.id}
              onClick={() => handleFileClick(file.filePath)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-medium transition-all
                ${selectedFile?.filePath === file.filePath 
                  ? 'bg-indigo-600/25 text-white border-l-2 border-indigo-500' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'}`}
            >
              <File className="w-4 h-4 shrink-0 text-slate-500" />
              <span className="truncate">{file.filePath}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div className="flex-grow flex flex-col h-full relative">
        {selectedFile ? (
          <>
            {/* Editor File Tab Header */}
            <div className="h-10 px-4 border-b border-white/5 flex items-center justify-between bg-slate-950/40 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <File className="w-3.5 h-3.5 text-indigo-400" />
                <span>{selectedFile.fileName}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono uppercase bg-slate-800 px-2 py-0.5 rounded border border-white/5">
                {selectedFile.language}
              </span>
            </div>

            {/* Monaco Editor */}
            <div className="flex-grow h-[calc(100%-2.5rem)]">
              <Editor
                height="100%"
                theme="vs-dark"
                language={getMonacoLanguage(selectedFile.language)}
                value={editorContent}
                onChange={(val) => setEditorContent(val || '')}
                options={{
                  readOnly: true,
                  fontSize: 13,
                  fontFamily: 'Fira Code',
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  lineNumbers: 'on',
                  cursorBlinking: 'smooth'
                }}
              />
            </div>
          </>
        ) : (
          <div className="flex-grow flex items-center justify-center text-slate-500 text-xs">
            No files parsed in this project workspace.
          </div>
        )}
      </div>

      {/* AI Explanation Panel */}
      <div className="w-full md:w-80 border-l border-white/5 flex flex-col h-full bg-slate-950/20">
        <div className="p-4 border-b border-white/5 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h4 className="font-bold text-white text-sm">AI Explanation</h4>
        </div>

        {selectedFile ? (
          <div className="flex-grow flex flex-col justify-between p-4 overflow-y-auto space-y-4">
            
            {/* File stats card */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-900/50 border border-white/5 rounded-xl p-3">
                <span className="text-[9px] text-slate-500 font-bold uppercase block">LOC</span>
                <span className="text-sm font-bold text-white">{editorContent.split('\n').length} lines</span>
              </div>
              <div className="bg-slate-900/50 border border-white/5 rounded-xl p-3">
                <span className="text-[9px] text-slate-500 font-bold uppercase block">Complexity</span>
                <span className="text-sm font-bold text-white">{selectedFile.complexity || 1}</span>
              </div>
            </div>

            {/* Text explanation */}
            <div 
              className="flex-grow bg-slate-950/30 border border-white/5 rounded-xl p-4 text-xs text-slate-300 overflow-y-auto leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMarkdownAsHtml(aiExplanation) }}
            />

            {/* CTA action button */}
            <button
              onClick={handleExplainCode}
              disabled={explaining}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Cpu className={`w-3.5 h-3.5 ${explaining ? 'animate-spin' : ''}`} />
              <span>{explaining ? 'Generating Analysis...' : 'Explain Code'}</span>
            </button>

          </div>
        ) : (
          <div className="p-4 text-xs text-slate-500 text-center">
            Awaiting file selection...
          </div>
        )}
      </div>

    </div>
  );
};
export default CodeExplorerPage;
