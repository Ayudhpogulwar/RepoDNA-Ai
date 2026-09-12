import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE } from '../config/api';

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
  createProject: (name: string, type: string, gitUrl: string, description: string, localPath?: string) => Promise<Project | null>;
  uploadCode: (projectId: number, fileName: string, content: string, language: string) => Promise<boolean>;
  triggerAnalysis: (projectId: number) => Promise<void>;
  askQuestion: (projectId: number, text: string) => Promise<string>;
  fetchVisualizations: (projectId: number, type: 'tree' | 'dependencies' | 'flow' | 'data') => Promise<void>;
  deleteProject: (projectId: number) => Promise<void>;
  fetchProjectHistory: (projectId: number) => Promise<void>;
  updateProjectSummaryAndRoadmap: (projectId: number, summary: string, learningRoadmap: string) => Promise<Project | null>;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

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
      console.warn('Backend unavailable while loading projects.');
      setProjects([]);
    }
  };

  const selectProject = async (projectId: number) => {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}`, { headers: getHeaders() });
      if (res.ok) {
        const proj = await res.json();
        setSelectedProject(proj);
        setFiles([]);
        setDependencies([]);
        setSecurityIssues([]);
        setSecurityRecommendations('');
        setChatHistory([]);
        setMermaidDiagrams(null);
        setGraphData({ nodes: [], edges: [] });
        setProjectHistory([]);

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
          const fetchedFiles = await filesRes.json();
          setFiles(Array.isArray(fetchedFiles) ? fetchedFiles : []);
        } else {
          setFiles([]);
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
          const sbomData = await sbomRes.json();
          setDependencies(Array.isArray(sbomData) ? sbomData : []);
        } else {
          setDependencies([]);
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
      } else {
        throw new Error('Project fetch failed');
      }
    } catch (err) {
      console.warn('Backend unavailable while loading project detail.');
      const proj = projects.find(p => p.id === projectId) || selectedProject || {
        id: projectId,
        name: 'Unavailable project',
        description: 'Project details could not be loaded from the backend.',
        gitUrl: null,
        localPath: null,
        type: 'REPOSITORY',
        healthScore: 0,
        securityScore: 0,
        createdAt: new Date().toISOString()
      };
      setSelectedProject(proj as Project);
      setFiles([]);
      setSecurityIssues([]);
      setSecurityRecommendations('');
      setDependencies([]);

      setChatHistory([]);
      setMermaidDiagrams(null);
      setGraphData({ nodes: [], edges: [] });
      setProjectHistory([]);
    }
  };

  const fetchProjectHistory = async (projectId: number) => {
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/history`, { headers: getHeaders() });
      if (res.ok) {
        setProjectHistory(await res.json());
      }
    } catch (err) {
      console.warn('Offline: using mock history data');
    }
  };

  const createProject = async (name: string, type: string, gitUrl: string, description: string, localPath?: string): Promise<Project | null> => {
    try {
      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name, type, gitUrl, description, localPath }),
      });

      if (res.ok) {
        const data = await res.json();
        setProjects(prev => [data, ...prev]);
        return data;
      }
      return null;
    } catch (err) {
      console.warn('Backend unavailable while creating project.');
      return null;
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
      console.warn('Backend unavailable while uploading code.');
      return false;
    }
  };

  const triggerAnalysis = async (projectId: number) => {
    try {
      setActiveProgress('Cloning Repository... (15%)');
      await fetch(`${API_BASE}/analysis/${projectId}`, {
        method: 'POST',
        headers: getHeaders(),
      });

      // Poll only progress text — do NOT reload all project data on each tick
      // Full reload (selectProject) happens once when analysis finishes
      const poll = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE}/analysis/${projectId}/progress`, { headers: getHeaders() });
          if (res.ok) {
            const progress = await res.text();
            setActiveProgress(progress);
            if (progress === 'Ready' || progress.startsWith('Error')) {
              clearInterval(poll);
              // Single full refresh once analysis is done
              await selectProject(projectId);
              if (!progress.startsWith('Error')) {
                setActiveProgress('Ready');
              }
            }
          } else {
            clearInterval(poll);
            setActiveProgress('Ready');
            await selectProject(projectId);
          }
        } catch {
          clearInterval(poll);
          setActiveProgress('Ready');
          await selectProject(projectId);
        }
      }, 2000);
    } catch (err) {
      console.warn('Backend unavailable while starting analysis.');
      setActiveProgress('Error: Backend unavailable while starting analysis.');
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
      console.warn('Backend unavailable while sending chat message.');
      const reply = 'Backend unavailable. Reconnect to the deployed API and run repository analysis before asking questions about this project.';
      const aiMsg: ChatMessage = {
        id: Date.now() + 1,
        sender: 'AI',
        messageText: reply,
        relevantFiles: JSON.stringify([]),
        timestamp: new Date().toISOString()
      };
      setChatHistory(prev => [...prev, aiMsg]);
      return reply;
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
      console.warn(`Backend unavailable while loading ${visualType} visualization.`);
      setGraphData({ nodes: [], edges: [] });
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
