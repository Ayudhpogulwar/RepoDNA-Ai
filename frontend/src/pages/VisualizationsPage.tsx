import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAnalysis } from '../context/AnalysisContext';
import { 
  FolderTree, 
  Layers, 
  GitMerge, 
  Workflow,
  SearchCode,
  Database
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

type VisualizationType = 'tree' | 'dependencies' | 'flow' | 'class' | 'sequence' | 'data';

export const VisualizationsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { graphData, mermaidDiagrams, fetchVisualizations } = useAnalysis();

  const [activeTab, setActiveTab] = useState<VisualizationType>('tree');

  // React Flow state hook bindings
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (activeTab === 'tree' || activeTab === 'dependencies' || activeTab === 'flow' || activeTab === 'data') {
      fetchVisualizations(Number(id), activeTab);
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
        navigate(`/project/${id}/explorer`);
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
    { type: 'dependencies', label: 'SBOM Network', icon: Layers },
    { type: 'data', label: 'Data Flow', icon: Database },
    { type: 'class', label: 'Class Flow', icon: SearchCode },
    { type: 'sequence', label: 'APIs Flow', icon: GitMerge }
  ] as const;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      {/* Visual Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-4 bg-slate-900/60 p-2 rounded-2xl border border-white/5 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.type}
            onClick={() => setActiveTab(tab.type)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all
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
        {(activeTab === 'tree' || activeTab === 'dependencies' || activeTab === 'flow' || activeTab === 'data') ? (
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
