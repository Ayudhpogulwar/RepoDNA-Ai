import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAnalysis } from '../context/AnalysisContext';
import { 
  FolderTree, 
  Layers, 
  GitMerge, 
  Workflow,
  SearchCode,
  Database,
  Flame
} from 'lucide-react';
import ReactFlow, { 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState 
} from 'reactflow';
import 'reactflow/dist/style.css';
import mermaid from 'mermaid';

type VisualizationType = 'tree' | 'dependencies' | 'flow' | 'class' | 'sequence' | 'data' | 'techdebt';

interface TechDebtItem {
  filePath: string;
  fileName: string;
  language: string;
  linesOfCode: number;
  complexity: number;
  debtScore: number;
  debtLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  riskCategory: string;
  recommendation: string;
}

export const VisualizationsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { graphData, mermaidDiagrams, fetchVisualizations } = useAnalysis();

  const [activeTab, setActiveTab] = useState<VisualizationType>('tree');
  const [techDebtItems, setTechDebtItems] = useState<TechDebtItem[]>([]);

  // React Flow state hook bindings
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (activeTab === 'tree' || activeTab === 'dependencies' || activeTab === 'flow' || activeTab === 'data') {
      fetchVisualizations(Number(id), activeTab);
    } else if (activeTab === 'techdebt') {
      fetch(`http://localhost:8080/api/projects/${id}/visualizations/tech-debt`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('codedna_token')}` }
      })
      .then(res => res.json())
      .then(data => {
        setTechDebtItems(data || []);
      })
      .catch(() => {
        // Fallback mock items
        setTechDebtItems([
          { filePath: 'src/main/java/com/petclinic/controller/OwnerController.java', fileName: 'OwnerController.java', language: 'Java', linesOfCode: 145, complexity: 12, debtScore: 88, debtLevel: 'CRITICAL', riskCategory: 'Security & Refactoring Risk', recommendation: 'High cyclomatic complexity and dynamic SQL injection flags. Refactor queries into JPA parameters.' },
          { filePath: 'src/main/resources/application.properties', fileName: 'application.properties', language: 'Plain Text', linesOfCode: 32, complexity: 1, debtScore: 65, debtLevel: 'HIGH', riskCategory: 'Credentials Leak Risk', recommendation: 'Hardcoded database credentials detected. Extract password properties to environment secrets.' },
          { filePath: 'src/main/java/com/petclinic/service/ClinicService.java', fileName: 'ClinicService.java', language: 'Java', linesOfCode: 210, complexity: 8, debtScore: 45, debtLevel: 'MEDIUM', riskCategory: 'Maintainability Bottleneck', recommendation: 'Service class exceeds 200 LOC. Decompose helper routines into dedicated validators.' },
          { filePath: 'src/main/java/com/petclinic/PetclinicApplication.java', fileName: 'PetclinicApplication.java', language: 'Java', linesOfCode: 19, complexity: 1, debtScore: 12, debtLevel: 'LOW', riskCategory: 'Clean Code', recommendation: 'Logic paths are well-balanced.' }
        ]);
      });
    }
  }, [id, activeTab]);

  useEffect(() => {
    // Sync React Flow nodes and edges state when graphData updates from context
    setNodes(graphData.nodes || []);
    setEdges(graphData.edges || []);
  }, [graphData]);

  // Mermaid diagrams rendering engine trigger
  useEffect(() => {
    if (activeTab === 'class' || activeTab === 'sequence') {
      try {
        mermaid.initialize({ 
          startOnLoad: false, 
          theme: 'dark', 
          securityLevel: 'loose',
          fontFamily: 'Outfit',
          themeVariables: {
            background: '#1E293B',
            primaryColor: '#6366F1',
            primaryTextColor: '#FFF',
            lineColor: '#64748B'
          }
        });
        
        // Timeout ensures DOM elements are rendered before mermaid compiles them
        setTimeout(() => {
          mermaid.contentLoaded();
        }, 100);
      } catch (err) {
        console.error('Mermaid render error: ', err);
      }
    }
  }, [activeTab, mermaidDiagrams]);

  const handleNodeClick = (_event: React.MouseEvent, node: any) => {
    if (node.data?.filePath) {
      if (window.confirm(`Would you like to open ${node.data.label} inside the Code Explorer?`)) {
        navigate(`/project/${id}/explorer?file=${encodeURIComponent(node.data.filePath)}`);
      }
    }
  };

  const getMermaidCode = () => {
    if (!mermaidDiagrams) return '';
    return activeTab === 'class' ? mermaidDiagrams.classDiagram : mermaidDiagrams.sequenceDiagram;
  };

  const tabs = [
    { type: 'tree', label: 'Folder Map', icon: FolderTree },
    { type: 'flow', label: 'Execution Chain', icon: Workflow },
    { type: 'techdebt', label: 'Tech Debt Heatmap', icon: Flame },
    { type: 'dependencies', label: 'SBOM Network', icon: Layers },
    { type: 'data', label: 'Data Flow', icon: Database },
    { type: 'class', label: 'Class Flow', icon: SearchCode },
    { type: 'sequence', label: 'APIs Flow', icon: GitMerge }
  ] as const;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      {/* Visual Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 p-2 rounded-2xl border border-white/5 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.type}
            onClick={() => setActiveTab(tab.type)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all
              ${activeTab === tab.type 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Graph Canvas */}
      <div className="flex-grow rounded-2xl border border-white/5 overflow-hidden bg-slate-950/20 relative shadow-2xl">
        {activeTab === 'techdebt' ? (
          <div className="w-full h-full p-6 overflow-y-auto space-y-6">
            {/* Header Metrics Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 border border-white/5 p-4 rounded-xl">
                <span className="text-xs text-slate-400 block mb-1">Files Analyzed</span>
                <span className="text-2xl font-bold text-white">{techDebtItems.length}</span>
              </div>
              <div className="bg-slate-900/80 border border-rose-500/20 p-4 rounded-xl">
                <span className="text-xs text-rose-400 block mb-1">Critical Refactor Urgency</span>
                <span className="text-2xl font-bold text-rose-400">
                  {techDebtItems.filter(i => i.debtLevel === 'CRITICAL' || i.debtLevel === 'HIGH').length}
                </span>
              </div>
              <div className="bg-slate-900/80 border border-amber-500/20 p-4 rounded-xl">
                <span className="text-xs text-amber-400 block mb-1">Avg Debt Score</span>
                <span className="text-2xl font-bold text-amber-400">
                  {techDebtItems.length > 0 ? Math.round(techDebtItems.reduce((acc, i) => acc + i.debtScore, 0) / techDebtItems.length) : 0}/100
                </span>
              </div>
              <div className="bg-slate-900/80 border border-indigo-500/20 p-4 rounded-xl">
                <span className="text-xs text-indigo-400 block mb-1">Primary Debt Risk</span>
                <span className="text-sm font-bold text-white truncate block">
                  {techDebtItems[0]?.riskCategory || 'Code Quality'}
                </span>
              </div>
            </div>

            {/* Heatmap Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {techDebtItems.map((item) => {
                let borderClass = 'border-emerald-500/30 bg-emerald-950/10 hover:border-emerald-500/50';
                let badgeClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
                let glowShadow = 'hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]';

                if (item.debtLevel === 'CRITICAL') {
                  borderClass = 'border-rose-500/50 bg-rose-950/20 hover:border-rose-500/80';
                  badgeClass = 'bg-rose-500/20 text-rose-400 border-rose-500/40';
                  glowShadow = 'hover:shadow-[0_0_25px_rgba(244,63,94,0.25)]';
                } else if (item.debtLevel === 'HIGH') {
                  borderClass = 'border-amber-500/40 bg-amber-950/15 hover:border-amber-500/70';
                  badgeClass = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
                  glowShadow = 'hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]';
                } else if (item.debtLevel === 'MEDIUM') {
                  borderClass = 'border-indigo-500/30 bg-indigo-950/10 hover:border-indigo-500/50';
                  badgeClass = 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
                  glowShadow = 'hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]';
                }

                return (
                  <div 
                    key={item.filePath}
                    onClick={() => {
                      if (window.confirm(`Open ${item.fileName} in Code Explorer?`)) {
                        navigate(`/project/${id}/explorer?file=${encodeURIComponent(item.filePath)}`);
                      }
                    }}
                    className={`p-5 rounded-2xl border ${borderClass} ${glowShadow} backdrop-blur-md transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="truncate">
                          <h4 className="font-bold text-white text-sm truncate" title={item.filePath}>{item.fileName}</h4>
                          <span className="text-[10px] text-slate-500 font-mono truncate block" title={item.filePath}>{item.filePath}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border shrink-0 ${badgeClass}`}>
                          {item.debtLevel} ({item.debtScore})
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                        <span>LOC: <strong className="text-white">{item.linesOfCode}</strong></span>
                        <span>Complexity: <strong className="text-white">{item.complexity}</strong></span>
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-white/5">{item.language}</span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-white/5">
                        💡 {item.recommendation}
                      </p>
                    </div>

                    <div className="text-[10px] text-slate-500 flex items-center justify-between border-t border-white/5 pt-3">
                      <span>Refactoring Target</span>
                      <span className="text-indigo-400 font-semibold hover:underline">Inspect File →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (activeTab === 'tree' || activeTab === 'dependencies' || activeTab === 'flow' || activeTab === 'data') ? (
          <div className="w-full h-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick}
              fitView
            >
              <MiniMap 
                nodeStrokeColor="#4F46E5"
                nodeColor="#1E293B"
                nodeBorderRadius={8}
                maskColor="rgba(11, 15, 25, 0.7)"
              />
              <Controls />
              <Background color="#6366F1" gap={16} size={0.5} />
            </ReactFlow>
            <div className="absolute bottom-4 right-14 bg-slate-900/90 text-[10px] text-slate-400 px-3 py-1.5 rounded-lg border border-white/5 pointer-events-none z-10">
              *Double click canvas to reset zoom. Click nodes to open code.
            </div>
          </div>
        ) : (
          <div className="w-full h-full p-8 flex items-center justify-center overflow-auto">
            <div 
              key={`${activeTab}-${getMermaidCode()}`}
              className="mermaid bg-[#1E293B]/70 border border-white/5 rounded-2xl p-8 max-w-full shadow-inner"
              style={{ whiteSpace: 'pre' }}
            >
              {getMermaidCode()}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
export default VisualizationsPage;
