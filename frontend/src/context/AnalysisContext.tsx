import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface Project {
  id: number;
  name: string;
  description: string;
  gitUrl: string | null;
  localPath: string | null;
  type: 'REPOSITORY' | 'FOLDER' | 'FILE';
  healthScore: number;
  securityScore: number;
  frameworks?: string;
  languages?: string;
  summary?: string;
  learningRoadmap?: string;
  createdAt: string;
}

export interface ProjectFile {
  id: number;
  filePath: string;
  fileName: string;
  content?: string;
  extension: string;
  language: string;
  size: number;
  complexity: number;
  summary: string;
}

export interface SecurityIssue {
  filePath: string;
  line: number;
  type: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  recommendation: string;
}

export interface Dependency {
  id: number;
  name: string;
  version: string;
  type: string;
  license: string;
  vulnerabilityStatus: 'SECURE' | 'OUTDATED' | 'VULNERABLE';
  description: string;
}

export interface ChatMessage {
  id: number;
  sender: 'USER' | 'AI';
  messageText: string;
  relevantFiles?: string; // JSON array string
  timestamp: string;
}

export interface AnalysisRun {
  id: number;
  healthScore: number;
  securityScore: number;
  linesOfCode: number;
  vulnerabilitiesCount: number;
  runDate: string;
}

interface GraphNode {
  id: string;
  type: string;
  data: { label: string; filePath?: string; status?: string; language?: string; size?: number };
  position: { x: number; y: number };
  style?: React.CSSProperties;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  style?: React.CSSProperties;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface AnalysisContextType {
  projects: Project[];
  selectedProject: Project | null;
  files: ProjectFile[];
  dependencies: Dependency[];
  securityIssues: SecurityIssue[];
  securityRecommendations: string;
  chatHistory: ChatMessage[];
  graphData: GraphData;
  mermaidDiagrams: { classDiagram: string; sequenceDiagram: string } | null;
  activeProgress: string;
  projectHistory: AnalysisRun[];
  fetchProjects: () => Promise<void>;
  selectProject: (projectId: number) => Promise<void>;
  createProject: (name: string, type: string, gitUrl: string, description: string) => Promise<Project | null>;
  uploadCode: (projectId: number, fileName: string, content: string, language: string) => Promise<boolean>;
  triggerAnalysis: (projectId: number) => Promise<void>;
  askQuestion: (projectId: number, text: string) => Promise<string>;
  fetchVisualizations: (projectId: number, type: 'tree' | 'dependencies' | 'flow' | 'data') => Promise<void>;
  deleteProject: (projectId: number) => Promise<void>;
  fetchProjectHistory: (projectId: number) => Promise<void>;
  updateProjectSummaryAndRoadmap: (projectId: number, summary: string, learningRoadmap: string) => Promise<Project | null>;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api';

export const AnalysisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [securityIssues, setSecurityIssues] = useState<SecurityIssue[]>([]);
  const [securityRecommendations, setSecurityRecommendations] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [mermaidDiagrams, setMermaidDiagrams] = useState<{ classDiagram: string; sequenceDiagram: string } | null>(null);
  const [activeProgress, setActiveProgress] = useState('Ready');
  const [projectHistory, setProjectHistory] = useState<AnalysisRun[]>([]);

  const getHeaders = () => {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    const devLevel = localStorage.getItem('dev_level') || 'mid';
    headers['X-Developer-Level'] = devLevel;
    return headers;
  };

  const fetchProjects = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/projects`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.warn('Backend offline, using mock projects.');
      // Load pre-configured mock projects list
      setProjects([
        {
          id: 1,
          name: 'Spring-Petclinic',
          description: 'A beautiful demonstration Spring Boot application illustrating MVC, JPA, and Security.',
          gitUrl: 'https://github.com/spring-projects/spring-petclinic.git',
          localPath: 'C:/Users/codedna/scratch/spring-petclinic',
          type: 'REPOSITORY',
          healthScore: 84,
          securityScore: 78,
          frameworks: 'Spring Boot, Spring Security, Spring Data JPA',
          languages: 'Java, HTML, CSS, JavaScript',
          createdAt: new Date().toISOString(),
          summary: 'This project is a classic Spring Boot reference architecture showing web services controllers linked to database repositories.',
          learningRoadmap: 'Day 1: Audit pom.xml and DB configs.\nDay 2: Trace controller endpoints mapping HTTP pathways.\nDay 3: Inspect Service layer workflows.'
        }
      ]);
    }
  };

  const selectProject = async (projectId: number) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}`, { headers: getHeaders() });
      if (res.ok) {
        const proj = await res.json();
        setSelectedProject(proj);

        // Fetch remaining workspace records in parallel
        const [filesRes, secRes, sbomRes, chatRes, vRes, histRes] = await Promise.all([
          fetch(`${API_BASE}/projects/${projectId}/files`, { headers: getHeaders() }),
          fetch(`${API_BASE}/projects/${projectId}/security`, { headers: getHeaders() }),
          fetch(`${API_BASE}/projects/${projectId}/sbom/dependencies`, { headers: getHeaders() }),
          fetch(`${API_BASE}/chat/${projectId}/history`, { headers: getHeaders() }),
          fetch(`${API_BASE}/projects/${projectId}/visualizations/mermaid`, { headers: getHeaders() }),
          fetch(`${API_BASE}/projects/${projectId}/history`, { headers: getHeaders() })
        ]);

        if (filesRes.ok) {
          setFiles(await filesRes.json());
        }
        if (secRes.ok && secRes.status !== 204) {
          const secData = await secRes.json();
          setSecurityIssues(JSON.parse(secData.issuesFound || '[]'));
          setSecurityRecommendations(secData.recommendations || '');
        } else {
          setSecurityIssues([]);
          setSecurityRecommendations('');
        }
        if (sbomRes.ok) {
          setDependencies(await sbomRes.json());
        }
        if (chatRes.ok) {
          setChatHistory(await chatRes.json());
        }
        if (vRes.ok) {
          setMermaidDiagrams(await vRes.json());
        }
        if (histRes.ok) {
          setProjectHistory(await histRes.json());
        }
      }
    } catch (err) {
      console.warn('Backend offline, loading mock project detail workspace.');
      // Find within mock projects
      const proj = projects.find(p => p.id === projectId) || null;
      setSelectedProject(proj);

      // Generate mock files explorer
      const mockFiles: ProjectFile[] = [
        { id: 101, filePath: 'src/main/java/com/petclinic/PetclinicApplication.java', fileName: 'PetclinicApplication.java', language: 'Java', extension: 'java', size: 450, complexity: 1, summary: 'Entry point launching Spring Application runner.' },
        { id: 102, filePath: 'src/main/java/com/petclinic/controller/OwnerController.java', fileName: 'OwnerController.java', language: 'Java', extension: 'java', size: 4500, complexity: 8, summary: 'REST controller handling HTTP actions for Owner records.' },
        { id: 103, filePath: 'src/main/java/com/petclinic/service/ClinicService.java', fileName: 'ClinicService.java', language: 'Java', extension: 'java', size: 3200, complexity: 5, summary: 'Service container for business validations.' },
        { id: 104, filePath: 'src/main/java/com/petclinic/repository/OwnerRepository.java', fileName: 'OwnerRepository.java', language: 'Java', extension: 'java', size: 1200, complexity: 2, summary: 'JPA Database queries interface.' },
        { id: 105, filePath: 'src/main/resources/application.properties', fileName: 'application.properties', language: 'Plain Text', extension: 'properties', size: 900, complexity: 1, summary: 'System configuration setup.' },
        { id: 106, filePath: 'pom.xml', fileName: 'pom.xml', language: 'XML', extension: 'xml', size: 3500, complexity: 1, summary: 'Maven build dependency tree manifest.' }
      ];
      setFiles(mockFiles);

      // Mock security scan details
      setSecurityIssues([
        { filePath: 'src/main/resources/application.properties', line: 12, type: 'SECRET', severity: 'HIGH', description: 'Hardcoded MySQL root password found.', recommendation: 'Extract password credentials to system environment variables.' },
        { filePath: 'src/main/java/com/petclinic/controller/OwnerController.java', line: 45, type: 'SQL_INJECTION', severity: 'HIGH', description: 'Raw query concatenation inside sql execution statement.', recommendation: 'Refactor query to use parameterized JPA query parameters.' },
        { filePath: 'pom.xml', line: 24, type: 'OUTDATED_PACKAGE', severity: 'HIGH', description: 'Using log4j version 2.14.0 containing critical Log4Shell RCE.', recommendation: 'Upgrade log4j artifact reference to version 2.17.1 or higher.' },
        { filePath: 'src/main/java/com/petclinic/service/ClinicService.java', line: 98, type: 'CODE_SMELL', severity: 'LOW', description: 'Empty catch block suppresses all failures.', recommendation: 'Add logging using Logger statement inside exception catch block.' }
      ]);
      setSecurityRecommendations('Found 3 high and 1 low-priority security concerns.\n\nImmediate Actions Required:\n- Upgrading Log4j in `pom.xml` to patch CVE-2021-44228\n- Refactoring dynamic SQL paths in `OwnerController.java` to block injection paths.');

      // Mock dependency list
      setDependencies([
        { id: 1, name: 'org.springframework.boot:spring-boot-starter-web', version: '3.1.2', type: 'MAVEN', license: 'Apache-2.0', vulnerabilityStatus: 'SECURE', description: 'Web framework core' },
        { id: 2, name: 'org.springframework.boot:spring-boot-starter-security', version: '3.1.2', type: 'MAVEN', license: 'Apache-2.0', vulnerabilityStatus: 'SECURE', description: 'Security filters' },
        { id: 3, name: 'org.apache.logging.log4j:log4j-core', version: '2.14.0', type: 'MAVEN', license: 'Apache-2.0', vulnerabilityStatus: 'VULNERABLE', description: 'Logging engine package' },
        { id: 4, name: 'mysql:mysql-connector-j', version: '8.0.33', type: 'MAVEN', license: 'GPLv2', vulnerabilityStatus: 'OUTDATED', description: 'Database JDBC connector' }
      ]);

      // Mock chat
      setChatHistory([
        { id: 1, sender: 'AI', messageText: 'Hello! I have completed analyzing your **Spring-Petclinic** repository. I have mapped its architecture patterns, dependencies, and flagged security concerns. Ask me anything about this codebase!', timestamp: new Date().toISOString() }
      ]);

      // Mock mermaid diagrams
      setMermaidDiagrams({
        classDiagram: `classDiagram
            class OwnerController {
                +getOwner()
                +addOwner()
            }
            class ClinicService {
                +findOwners()
                +saveOwner()
            }
            class OwnerRepository {
                +findByLastName()
            }
            OwnerController --> ClinicService : invokes
            ClinicService --> OwnerRepository : queries`,
        sequenceDiagram: `sequenceDiagram
            actor User as Client
            participant API as OwnerController
            participant Svc as ClinicService
            participant DB as OwnerRepository
            
            User->>API: GET /owners/find
            API->>Svc: findOwners(lastName)
            Svc->>DB: findByLastName(lastName)
            DB-->>Svc: List<Owner> records
            Svc-->>API: Processed records
            API-->>User: Rendered HTML dashboard`
      });

      // Default mock graph tree nodes
      fetchVisualizations(projectId, 'tree');

      const mockHistory = [
        { id: 1, healthScore: 70, securityScore: 60, linesOfCode: 150, vulnerabilitiesCount: 12, runDate: new Date(Date.now() - 3 * 86400000).toISOString() },
        { id: 2, healthScore: 78, securityScore: 72, linesOfCode: 168, vulnerabilitiesCount: 5, runDate: new Date(Date.now() - 1 * 86400000).toISOString() },
        { id: 3, healthScore: 84, securityScore: 78, linesOfCode: 174, vulnerabilitiesCount: 2, runDate: new Date().toISOString() }
      ];
      setProjectHistory(mockHistory);
    }
  };

  const fetchProjectHistory = async (projectId: number) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/history`, { headers: getHeaders() });
      if (res.ok) {
        setProjectHistory(await res.json());
      }
    } catch (err) {
      console.warn('Offline: using mock history data');
    }
  };

  const createProject = async (name: string, type: string, gitUrl: string, description: string): Promise<Project | null> => {
    try {
      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name, type, gitUrl, description }),
      });

      if (res.ok) {
        const data = await res.json();
        setProjects(prev => [data, ...prev]);
        return data;
      }
      return null;
    } catch (err) {
      console.warn('Backend offline, simulating project creation.');
      const mockProject: Project = {
        id: Date.now(),
        name,
        description,
        gitUrl: gitUrl || null,
        localPath: gitUrl ? `C:/codedna-ai/uploads/repo-${Date.now()}` : 'C:/codedna-ai/uploads/folder-upload',
        type: type as any,
        healthScore: 100,
        securityScore: 100,
        createdAt: new Date().toISOString(),
        frameworks: 'React, Node.js',
        languages: 'TypeScript, CSS, HTML',
        summary: 'A custom software project workspace.',
        learningRoadmap: 'Day 1: Read structural dependencies.\nDay 2: Audit endpoint routes.'
      };
      setProjects(prev => [mockProject, ...prev]);
      return mockProject;
    }
  };

  const uploadCode = async (projectId: number, fileName: string, content: string, language: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/analysis/${projectId}/upload-code`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ fileName, content, language }),
      });
      return res.ok;
    } catch (err) {
      console.warn('Backend offline, code upload simulated.');
      // Add simulated file to files explorer
      const newFile: ProjectFile = {
        id: Date.now(),
        filePath: fileName,
        fileName: fileName,
        language: language || 'JavaScript',
        extension: fileName.substring(fileName.lastIndexOf('.') + 1),
        size: content.length,
        complexity: 3,
        summary: 'Direct user uploaded source file.'
      };
      setFiles(prev => [...prev, newFile]);
      return true;
    }
  };

  const triggerAnalysis = async (projectId: number) => {
    if (!token) return;
    try {
      setActiveProgress('Cloning Repository... (15%)');
      await fetch(`${API_BASE}/analysis/${projectId}`, {
        method: 'POST',
        headers: getHeaders(),
      });

      // Poll progress
      const poll = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE}/analysis/${projectId}/progress`, { headers: getHeaders() });
          if (res.ok) {
            const progress = await res.text();
            setActiveProgress(progress);
            if (progress === 'Ready' || progress.startsWith('Error')) {
              clearInterval(poll);
              // Reload details
              selectProject(projectId);
            }
          } else {
            clearInterval(poll);
          }
        } catch {
          clearInterval(poll);
          setActiveProgress('Ready');
        }
      }, 2000);
    } catch (err) {
      console.warn('Backend offline, running simulated progress pipeline.');
      const stages = [
        'Cloning Repository... (15%)',
        'Reading Files and Detecting Languages... (30%)',
        'Finding Dependencies and Generating SBOM... (50%)',
        'Running Security Scanner... (70%)',
        'Creating AI Knowledge Base... (85%)',
        'Generating Architecture & Documentation... (95%)',
        'Ready'
      ];
      let i = 0;
      const poll = setInterval(() => {
        setActiveProgress(stages[i]);
        if (stages[i] === 'Ready') {
          clearInterval(poll);
          // Reload
          selectProject(projectId);
        }
        i++;
      }, 1000);
    }
  };

  const askQuestion = async (projectId: number, text: string): Promise<string> => {
    // Add user message to history
    const userMsg: ChatMessage = {
      id: Date.now(),
      sender: 'USER',
      messageText: text,
      timestamp: new Date().toISOString()
    };
    setChatHistory(prev => [...prev, userMsg]);

    try {
      const res = await fetch(`${API_BASE}/chat/${projectId}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message: text }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: ChatMessage = {
          id: Date.now() + 1,
          sender: 'AI',
          messageText: data.response,
          relevantFiles: JSON.stringify(data.relevantFiles),
          timestamp: new Date().toISOString()
        };
        setChatHistory(prev => [...prev, aiMsg]);
        return data.response;
      }
      
      let errorMsg = 'Error generating response. Please check your backend connection and make sure your AI API Key is configured in settings.';
      try {
        const errorData = await res.json();
        if (errorData && errorData.response) {
          errorMsg = errorData.response;
        }
      } catch (e) {}
      
      const aiErrorMsg: ChatMessage = {
        id: Date.now() + 1,
        sender: 'AI',
        messageText: errorMsg,
        timestamp: new Date().toISOString()
      };
      setChatHistory(prev => [...prev, aiErrorMsg]);
      return errorMsg;
    } catch (err) {
      console.warn('Backend chat offline, generating smart simulated context answer.');
      return new Promise((resolve) => {
        setTimeout(() => {
          let reply = `Based on the repository index, I searched for classes referencing \`${text}\`:\n\n`;
          if (text.toLowerCase().includes('auth') || text.toLowerCase().includes('jwt')) {
            reply += `The authentication config utilizes a stateless security filter chain. \`JwtAuthenticationFilter\` intercepts requests, validating base64 signed JWT tokens from the Authorization HTTP header.`;
          } else if (text.toLowerCase().includes('db') || text.toLowerCase().includes('sql') || text.toLowerCase().includes('database')) {
            reply += `The database mapper layer maps classes to schema tables using JPA. \`OwnerRepository\` extends \`JpaRepository\` to query tables, but notice dynamic statements in \`OwnerController.java\` line 45 which has a SQL Injection risk flags.`;
          } else {
            reply += `The repository exposes modular controllers (like \`OwnerController\`) linking queries through the clinic services engine. You can trace its call flow directly inside the Visualizations node map dashboard.`;
          }

          const aiMsg: ChatMessage = {
            id: Date.now() + 1,
            sender: 'AI',
            messageText: reply,
            relevantFiles: JSON.stringify(['src/main/java/com/petclinic/controller/OwnerController.java']),
            timestamp: new Date().toISOString()
          };
          setChatHistory(prev => [...prev, aiMsg]);
          resolve(reply);
        }, 1000);
      });
    }
  };

  const fetchVisualizations = async (projectId: number, visualType: 'tree' | 'dependencies' | 'flow' | 'data') => {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/visualizations/${visualType}`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        
        // Step 1: Assign a level/layer to each node based on context type
        const nodesWithLevels = data.nodes.map((n: any) => {
          let level = 0;
          if (visualType === 'tree') {
            if (n.id === 'root') {
              level = 0;
            } else {
              // Count slashes in path for depth level representation
              const slashes = (n.id.match(/\//g) || []).length;
              level = slashes + 1;
            }
          } else if (visualType === 'flow') {
            if (n.type === 'controller') level = 0;
            else if (n.type === 'service') level = 1;
            else if (n.type === 'repository') level = 2;
            else if (n.type === 'model') level = 3;
          } else if (visualType === 'dependencies') {
            if (n.id === 'app-root') level = 0;
            else level = 1;
          } else if (visualType === 'data') {
            if (n.id === 'input-user') level = 0;
            else if (n.id.startsWith('ep-')) level = 1;
            else if (n.id.startsWith('tbl-')) level = 2;
          }
          return { ...n, level };
        });

        // Step 2: Group nodes by level
        const levelGroups: Record<number, any[]> = {};
        nodesWithLevels.forEach((n: any) => {
          if (!levelGroups[n.level]) {
            levelGroups[n.level] = [];
          }
          levelGroups[n.level].push(n);
        });

        // Step 3: Map into React Flow compatible items with computed layout coordinates
        const flowNodes = nodesWithLevels.map((n: any) => {
          const group = levelGroups[n.level];
          const indexInGroup = group.findIndex(item => item.id === n.id);
          const totalInGroup = group.length;

          // Compute X coordinate to space nodes out evenly and center them around X=300
          const spacing = 240;
          const totalWidth = (totalInGroup - 1) * spacing;
          const x = 300 + (indexInGroup * spacing) - (totalWidth / 2);
          
          // Compute Y coordinate based on layer level
          const y = 50 + n.level * 180;

          // Determine aesthetic style based on node type and status
          let background = 'rgba(15, 23, 42, 0.75)';
          let border = '1px solid rgba(255, 255, 255, 0.08)';
          let textColor = '#F8FAFC';
          let shadow = '0 4px 12px rgba(0, 0, 0, 0.3)';

          if (n.type === 'folder' || n.type === 'app') {
            background = 'rgba(17, 24, 39, 0.9)';
            border = '1px solid rgba(16, 185, 129, 0.4)'; // Emerald highlight for directories
            textColor = '#34D399'; // Emerald text
            shadow = '0 0 15px rgba(16, 185, 129, 0.1)';
          } else if (n.type === 'controller') {
            background = 'rgba(219, 39, 119, 0.15)'; // Fuchsia for API Gateways/Controllers
            border = '1px solid rgba(236, 72, 153, 0.6)';
            textColor = '#F472B6';
            shadow = '0 0 20px rgba(236, 72, 153, 0.2)';
          } else if (n.type === 'service') {
            background = 'rgba(79, 70, 229, 0.15)'; // Indigo for Services/Logic
            border = '1px solid rgba(99, 102, 241, 0.6)';
            textColor = '#818CF8';
            shadow = '0 0 20px rgba(99, 102, 241, 0.2)';
          } else if (n.type === 'repository') {
            background = 'rgba(217, 119, 6, 0.15)'; // Amber for DB queries
            border = '1px solid rgba(245, 158, 11, 0.6)';
            textColor = '#FBBF24';
            shadow = '0 0 20px rgba(245, 158, 11, 0.2)';
          } else if (n.type === 'model') {
            background = 'rgba(5, 150, 105, 0.15)'; // Emerald for DB Entities
            border = '1px solid rgba(16, 185, 129, 0.6)';
            textColor = '#34D399';
            shadow = '0 0 20px rgba(16, 185, 129, 0.2)';
          } else if (n.data?.status === 'VULNERABLE') {
            background = 'rgba(220, 38, 38, 0.25)'; // Rose/Red for vulnerabilities
            border = '1px solid rgba(244, 63, 94, 0.7)';
            textColor = '#FB7185';
            shadow = '0 0 25px rgba(244, 63, 94, 0.35)';
          }

          return {
            id: n.id,
            type: n.type === 'folder' || n.type === 'app' ? 'input' : 'default',
            data: { label: n.label, filePath: n.data.filePath, status: n.data.status, language: n.data.language, size: n.data.size },
            position: { x, y },
            style: {
              background,
              color: textColor,
              border,
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '11px',
              fontWeight: '600',
              fontFamily: 'Outfit, sans-serif',
              width: '200px',
              boxShadow: shadow,
              backdropFilter: 'blur(8px)'
            }
          };
        });

        // Map edges and style them dynamically with animations
        const flowEdges = data.edges.map((e: any) => {
          const isAnimated = e.animated === 'true' || e.source.startsWith('ep-') || e.source.startsWith('ctrl-');
          const isVulnerable = e.animated === 'true'; // Set earlier for vulnerability pathways
          return {
            id: e.id,
            source: e.source,
            target: e.target,
            label: e.label,
            animated: isAnimated,
            style: {
              stroke: isVulnerable ? '#F43F5E' : '#6366F1',
              strokeWidth: isVulnerable ? 2.5 : 1.5,
              opacity: 0.8
            }
          };
        });

        setGraphData({ nodes: flowNodes, edges: flowEdges });
      }
    } catch (err) {
      console.warn('Backend offline, loading mock React Flow nodes.');
      // Create custom layout nodes for local mock tree
      if (visualType === 'tree') {
        setGraphData({
          nodes: [
            { id: 'root', type: 'input', data: { label: 'Project Root' }, position: { x: 250, y: 20 }, style: { background: '#1E293B', color: '#FFF', border: '1px solid #6366F1', width: 160 } },
            { id: 'src', type: 'default', data: { label: 'src/ (folder)' }, position: { x: 150, y: 120 }, style: { background: 'rgba(30,41,59,0.8)', color: '#FFF', width: 140 } },
            { id: 'pom', type: 'output', data: { label: 'pom.xml (file)', filePath: 'pom.xml' }, position: { x: 380, y: 120 }, style: { background: 'rgba(99, 102, 241, 0.2)', color: '#FFF', width: 140 } },
            { id: 'main', type: 'default', data: { label: 'src/main/java (folder)' }, position: { x: 80, y: 220 }, style: { background: 'rgba(30,41,59,0.8)', color: '#FFF', width: 160 } },
            { id: 'resources', type: 'output', data: { label: 'src/main/resources', filePath: 'src/main/resources/application.properties' }, position: { x: 270, y: 220 }, style: { background: 'rgba(30,41,59,0.8)', color: '#FFF', width: 160 } },
            { id: 'app', type: 'output', data: { label: 'PetclinicApplication.java', filePath: 'src/main/java/com/petclinic/PetclinicApplication.java' }, position: { x: 20, y: 320 }, style: { background: 'rgba(236,72,153,0.2)', color: '#FFF', width: 180 } },
            { id: 'ctrl', type: 'output', data: { label: 'OwnerController.java', filePath: 'src/main/java/com/petclinic/controller/OwnerController.java' }, position: { x: 220, y: 320 }, style: { background: 'rgba(99,102,241,0.2)', color: '#FFF', width: 180 } }
          ],
          edges: [
            { id: 'r-s', source: 'root', target: 'src', style: { stroke: '#6366F1' } },
            { id: 'r-p', source: 'root', target: 'pom', style: { stroke: '#6366F1' } },
            { id: 's-m', source: 'src', target: 'main', style: { stroke: '#6366F1' } },
            { id: 's-res', source: 'src', target: 'resources', style: { stroke: '#6366F1' } },
            { id: 'm-a', source: 'main', target: 'app', style: { stroke: '#6366F1' } },
            { id: 'm-c', source: 'main', target: 'ctrl', style: { stroke: '#6366F1' } }
          ]
        });
      } else if (visualType === 'dependencies') {
        setGraphData({
          nodes: [
            { id: 'app', type: 'input', data: { label: 'Primary Application' }, position: { x: 250, y: 20 }, style: { background: '#1E293B', color: '#FFF', width: 180 } },
            { id: 'spring-web', type: 'output', data: { label: 'spring-boot-starter-web (3.1.2)' }, position: { x: 50, y: 150 }, style: { background: 'rgba(16, 185, 129, 0.2)', color: '#FFF', width: 220 } },
            { id: 'spring-sec', type: 'output', data: { label: 'spring-boot-starter-security (3.1.2)' }, position: { x: 300, y: 150 }, style: { background: 'rgba(16, 185, 129, 0.2)', color: '#FFF', width: 220 } },
            { id: 'log4j', type: 'output', data: { label: 'log4j-core (2.14.0) [VULNERABLE]' }, position: { x: 175, y: 260 }, style: { background: 'rgba(239, 68, 68, 0.2)', color: '#FFF', border: '1px solid #EF4444', width: 250 } }
          ],
          edges: [
            { id: 'a-sw', source: 'app', target: 'spring-web', animated: true, style: { stroke: '#10B981' } },
            { id: 'a-ss', source: 'app', target: 'spring-sec', animated: true, style: { stroke: '#10B981' } },
            { id: 'a-l4j', source: 'app', target: 'log4j', animated: true, style: { stroke: '#EF4444' } }
          ]
        });
      } else if (visualType === 'flow') {
        setGraphData({
          nodes: [
            { id: 'ctrl', type: 'input', data: { label: 'OwnerController.java' }, position: { x: 20, y: 100 }, style: { background: '#6366F1', color: '#FFF', width: 160 } },
            { id: 'svc', type: 'default', data: { label: 'ClinicService.java' }, position: { x: 220, y: 100 }, style: { background: '#8B5CF6', color: '#FFF', width: 160 } },
            { id: 'rep', type: 'default', data: { label: 'OwnerRepository.java' }, position: { x: 420, y: 100 }, style: { background: '#EC4899', color: '#FFF', width: 160 } },
            { id: 'model', type: 'output', data: { label: 'Owner.java' }, position: { x: 620, y: 100 }, style: { background: '#1E293B', color: '#FFF', width: 160 } }
          ],
          edges: [
            { id: 'c-s', source: 'ctrl', target: 'svc', label: 'invokes', animated: true, style: { stroke: '#6366F1' } },
            { id: 's-r', source: 'svc', target: 'rep', label: 'queries', animated: true, style: { stroke: '#8B5CF6' } },
            { id: 'r-m', source: 'rep', target: 'model', label: 'maps', style: { stroke: '#EC4899' } }
          ]
        });
      } else if (visualType === 'data') {
        setGraphData({
          nodes: [
            { id: 'input-user', type: 'input', data: { label: 'User Input / Client Request' }, position: { x: 250, y: 20 }, style: { background: '#1E293B', color: '#FFF', width: 220 } },
            { id: 'ep-login', type: 'default', data: { label: 'Endpoint: /api/auth/login' }, position: { x: 100, y: 150 }, style: { background: 'rgba(99, 102, 241, 0.8)', color: '#FFF', width: 200 } },
            { id: 'ep-projects', type: 'default', data: { label: 'Endpoint: /api/projects' }, position: { x: 380, y: 150 }, style: { background: 'rgba(99, 102, 241, 0.8)', color: '#FFF', width: 200 } },
            { id: 'tbl-users', type: 'output', data: { label: 'Table: users' }, position: { x: 100, y: 280 }, style: { background: '#0F172A', color: '#FFF', width: 180 } },
            { id: 'tbl-projects', type: 'output', data: { label: 'Table: projects' }, position: { x: 380, y: 280 }, style: { background: '#0F172A', color: '#FFF', width: 180 } }
          ],
          edges: [
            { id: 'u-l', source: 'input-user', target: 'ep-login', animated: true, style: { stroke: '#6366F1' } },
            { id: 'u-p', source: 'input-user', target: 'ep-projects', animated: true, style: { stroke: '#6366F1' } },
            { id: 'l-u', source: 'ep-login', target: 'tbl-users', animated: true, style: { stroke: '#10B981' } },
            { id: 'p-pr', source: 'ep-projects', target: 'tbl-projects', animated: true, style: { stroke: '#10B981' } }
          ]
        });
      }
    }
  };

  const updateProjectSummaryAndRoadmap = async (projectId: number, summary: string, learningRoadmap: string): Promise<Project | null> => {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ summary, learningRoadmap }),
      });

      if (res.ok) {
        const data = await res.json();
        setProjects(prev => prev.map(p => p.id === projectId ? data : p));
        if (selectedProject?.id === projectId) {
          setSelectedProject(data);
        }
        return data;
      }
      return null;
    } catch (err) {
      console.warn('Backend offline, simulating project update.');
      const updated = selectedProject ? { ...selectedProject, summary, learningRoadmap } : null;
      if (updated) {
        setProjects(prev => prev.map(p => p.id === projectId ? updated : p));
        setSelectedProject(updated);
      }
      return updated;
    }
  };

  const deleteProject = async (projectId: number) => {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        if (selectedProject?.id === projectId) {
          setSelectedProject(null);
        }
      }
    } catch {
      console.warn('Backend offline, simulating project deletion.');
      setProjects(prev => prev.filter(p => p.id !== projectId));
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }
    }
  };

  useEffect(() => {
    if (token) {
      fetchProjects();
    } else {
      setProjects([]);
      setSelectedProject(null);
      setFiles([]);
    }
  }, [token]);

  return (
    <AnalysisContext.Provider value={{
      projects,
      selectedProject,
      files,
      dependencies,
      securityIssues,
      securityRecommendations,
      chatHistory,
      graphData,
      mermaidDiagrams,
      activeProgress,
      projectHistory,
      fetchProjects,
      selectProject,
      createProject,
      uploadCode,
      triggerAnalysis,
      askQuestion,
      fetchVisualizations,
      deleteProject,
      fetchProjectHistory,
      updateProjectSummaryAndRoadmap,
    }}>
      {children}
    </AnalysisContext.Provider>
  );
};

export const useAnalysis = () => {
  const context = useContext(AnalysisContext);
  if (!context) throw new Error('useAnalysis must be used inside AnalysisProvider');
  return context;
};
