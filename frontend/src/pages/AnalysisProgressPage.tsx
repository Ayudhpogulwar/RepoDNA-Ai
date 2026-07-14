import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAnalysis } from '../context/AnalysisContext';
import { Terminal, CheckCircle2, AlertTriangle, Dna } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';

export const AnalysisProgressPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeProgress, selectedProject, selectProject } = useAnalysis();
  
  const [logs, setLogs] = useState<string[]>([]);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      selectProject(Number(id));
    }
  }, [id]);

  useEffect(() => {
    if (activeProgress) {
      setLogs(prev => {
        // Only append if new progress log line is different from the last log
        if (prev.length === 0 || prev[prev.length - 1] !== activeProgress) {
          return [...prev, `[INFO] ${new Date().toLocaleTimeString()} - ${activeProgress}`];
        }
        return prev;
      });
    }
  }, [activeProgress]);

  useEffect(() => {
    // Auto scroll console logs
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const isCompleted = activeProgress === 'Ready';
  const isFailed = activeProgress.startsWith('Error');

  const handleFinish = () => {
    navigate(`/project/${id}`);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0B0F19] p-6 lg:p-8 flex flex-col items-center justify-center relative">
      <div className="glow-primary top-[20%] left-[20%]" />
      <div className="glow-secondary bottom-[20%] right-[20%]" />

      <GlassCard className="w-full max-w-3xl p-8 space-y-6 relative z-10">
        
        {/* Header progress info */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white">Analyzing Code DNA</h2>
            <p className="text-xs text-slate-400">Project: {selectedProject?.name || 'Workspace'}</p>
          </div>
          <div className="flex items-center gap-3">
            {!isCompleted && !isFailed && (
              <Dna className="w-6 h-6 text-indigo-400 animate-spin" />
            )}
            {isCompleted && (
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            )}
            {isFailed && (
              <AlertTriangle className="w-6 h-6 text-rose-400" />
            )}
          </div>
        </div>

        {/* Dynamic progress bar */}
        <div className="w-full bg-slate-950/80 rounded-full h-2.5 overflow-hidden border border-white/5">
          <div 
            className={`h-full transition-all duration-500 rounded-full ${isFailed ? 'bg-rose-500' : isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
            style={{ 
              width: isCompleted ? '100%' : isFailed ? '100%' : 
                activeProgress.includes('95%') ? '95%' : 
                activeProgress.includes('85%') ? '85%' : 
                activeProgress.includes('70%') ? '70%' : 
                activeProgress.includes('50%') ? '50%' : 
                activeProgress.includes('30%') ? '30%' : 
                activeProgress.includes('15%') ? '15%' : '5%' 
            }}
          />
        </div>

        {/* Scrolling terminal window */}
        <div className="bg-black/80 rounded-2xl border border-white/5 p-5 font-mono text-xs text-slate-300 space-y-2 h-72 overflow-y-auto shadow-inner">
          <div className="flex items-center gap-2 text-slate-500 border-b border-white/5 pb-2 mb-2">
            <Terminal className="w-4 h-4" />
            <span>Live Analysis Console Pipeline</span>
          </div>

          <div className="space-y-1.5">
            <div className="text-indigo-400">[SYSTEM] CodeDNA AI static parsing initialized...</div>
            {logs.map((logLine, idx) => (
              <div key={idx} className={logLine.includes('Error') ? 'text-rose-400' : logLine.includes('Ready') ? 'text-emerald-400' : 'text-slate-300'}>
                {logLine}
              </div>
            ))}
            {isCompleted && (
              <div className="text-emerald-400 font-semibold mt-2">[SUCCESS] Code analysis finished! Database index, SBOM components, and flow nodes loaded.</div>
            )}
            {isFailed && (
              <div className="text-rose-400 font-semibold mt-2">[ERROR] Pipeline crashed. Please check repository URL accessibility or file upload format.</div>
            )}
            <div ref={consoleEndRef} />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          {isCompleted ? (
            <button
              onClick={handleFinish}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-md shadow-indigo-600/20"
            >
              Enter CodeDNA Workspace
            </button>
          ) : (
            <button
              onClick={() => navigate('/dashboard')}
              className="text-slate-400 hover:text-white text-sm font-semibold transition-colors"
            >
              Return to Dashboard
            </button>
          )}
        </div>

      </GlassCard>
    </div>
  );
};
export default AnalysisProgressPage;
