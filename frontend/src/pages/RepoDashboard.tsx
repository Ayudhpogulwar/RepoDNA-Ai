import React from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import { GlassCard } from '../components/GlassCard';
import { 
  HeartPulse, 
  ShieldAlert, 
  Sparkles, 
  ListTodo,
  Pencil,
  Check,
  X
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export const RepoDashboard: React.FC = () => {
  const { 
    selectedProject, 
    files, 
    projectHistory, 
    triggerAnalysis, 
    activeProgress,
    updateProjectSummaryAndRoadmap
  } = useAnalysis();

  if (!selectedProject) return null;

  const isAnalyzing = activeProgress !== 'Ready' && !activeProgress.startsWith('Error');

  const [editSummary, setEditSummary] = React.useState(false);
  const [summaryText, setSummaryText] = React.useState('');
  const [editRoadmap, setEditRoadmap] = React.useState(false);
  const [roadmapText, setRoadmapText] = React.useState('');
  const [savingSummary, setSavingSummary] = React.useState(false);
  const [savingRoadmap, setSavingRoadmap] = React.useState(false);

  React.useEffect(() => {
    if (selectedProject) {
      setSummaryText(selectedProject.summary || '');
      setRoadmapText(selectedProject.learningRoadmap || '');
    }
  }, [selectedProject]);

  const handleReanalyze = async () => {
    await triggerAnalysis(selectedProject.id);
  };

  const handleSaveSummary = async () => {
    setSavingSummary(true);
    await updateProjectSummaryAndRoadmap(selectedProject.id, summaryText, selectedProject.learningRoadmap || '');
    setEditSummary(false);
    setSavingSummary(false);
  };

  const handleSaveRoadmap = async () => {
    setSavingRoadmap(true);
    await updateProjectSummaryAndRoadmap(selectedProject.id, selectedProject.summary || '', roadmapText);
    setEditRoadmap(false);
    setSavingRoadmap(false);
  };

  // Simple statistics count
  const fileCount = files.length;
  
  // Count component files (controllers, services, repositories)
  const controllersCount = files.filter(f => f.content?.includes('@RestController') || f.content?.includes('@Controller') || f.content?.includes('Router')).length || 1;
  const servicesCount = files.filter(f => f.content?.includes('@Service') || f.filePath.toLowerCase().includes('service')).length || 1;
  const reposCount = files.filter(f => f.content?.includes('@Repository') || f.content?.includes('JpaRepository') || f.filePath.toLowerCase().includes('repository')).length || 1;
  const modelsCount = files.filter(f => f.content?.includes('@Entity') || f.filePath.toLowerCase().includes('model')).length || 1;

  // Format runs history for Recharts
  const chartData = (projectHistory || []).map((run, idx) => {
    const dateObj = new Date(run.runDate);
    return {
      name: `Run #${idx + 1}`,
      date: dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      health: run.healthScore,
      security: run.securityScore,
      loc: run.linesOfCode,
      vulnerabilities: run.vulnerabilitiesCount
    };
  });

  const formatMarkdownText = (text: string) => {
    if (!text) return '';
    // 1. Remove markdown horizontal rules (---)
    let formatted = text.replace(/^-{3,}\s*$/gm, '');
    
    // 2. Remove headers syntax (## or ###) but keep the text
    formatted = formatted.replace(/^#+\s*(.*)$/gm, '$1');

    // 3. Remove bold indicators (**)
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '$1');

    // 4. Clean up lists (convert leading "- " or "* " to bullet points "• ")
    formatted = formatted.replace(/^[-*]\s+/gm, '• ');

    return formatted;
  };

  return (
    <div className="space-y-8">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Project Overview</h1>
          <p className="text-sm text-slate-400">AI-generated software architecture and static scanning results</p>
        </div>
        <button 
          onClick={handleReanalyze} 
          disabled={isAnalyzing}
          className={`flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all border border-indigo-400/20 shadow-lg shadow-indigo-500/10 disabled:opacity-60 disabled:cursor-not-allowed ${isAnalyzing ? 'animate-pulse' : ''}`}
        >
          <Sparkles className="w-4 h-4" />
          {isAnalyzing ? `Analyzing: ${activeProgress}` : 'Re-analyze Project'}
        </button>
      </div>

      {/* Scores and Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Project metrics */}
        <GlassCard className="flex flex-col justify-between space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h4 className="text-slate-400 text-xs font-semibold uppercase">Project Health</h4>
              <p className="text-3xl font-extrabold text-white">{selectedProject.healthScore}%</p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <HeartPulse className="w-6 h-6 animate-pulse" />
            </div>
          </div>
          <div className="w-full bg-slate-950/60 h-2 rounded-full overflow-hidden border border-white/5">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${selectedProject.healthScore}%` }} />
          </div>
          <div className="text-[10px] text-slate-500">Based on cyclomatic complexity and clean code rules.</div>
        </GlassCard>

        <GlassCard className="flex flex-col justify-between space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h4 className="text-slate-400 text-xs font-semibold uppercase">Security Score</h4>
              <p className="text-3xl font-extrabold text-rose-400">{selectedProject.securityScore}%</p>
            </div>
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>
          <div className="w-full bg-slate-950/60 h-2 rounded-full overflow-hidden border border-white/5">
            <div className="bg-rose-500 h-full rounded-full" style={{ width: `${selectedProject.securityScore}%` }} />
          </div>
          <div className="text-[10px] text-slate-500">Based on hardcoded secrets and code injection flags.</div>
        </GlassCard>

        {/* Tech Stack Stats */}
        <GlassCard className="space-y-4">
          <h4 className="text-slate-400 text-xs font-semibold uppercase">Workspace Specs</h4>
          <div className="space-y-3 text-sm">
            <div className="flex flex-col gap-1.5 border-b border-white/5 pb-2">
              <span className="text-slate-500 text-xs">Languages Detected</span>
              <div className="flex flex-wrap gap-1 mt-0.5 justify-end">
                {(selectedProject.languages || 'Java').split(', ').map(lang => (
                  <span key={lang} className="text-[10px] text-slate-300 font-semibold px-2 py-0.5 bg-slate-800 rounded-full border border-white/5">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5 border-b border-white/5 pb-2">
              <span className="text-slate-500 text-xs">Frameworks Detected</span>
              <div className="flex flex-wrap gap-1 mt-0.5 justify-end">
                {(selectedProject.frameworks || 'None').split(', ').map(fw => (
                  <span key={fw} className="text-[10px] text-indigo-300 font-semibold px-2 py-0.5 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                    {fw}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Files Indexed</span>
              <span className="text-white font-medium">{fileCount} files</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Health Trend Charts */}
      {projectHistory.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card 1: Score Trends */}
          <GlassCard className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">Quality & Security Trends</h3>
              <p className="text-xs text-slate-400">Progression of Health Index and Security Scores over runs</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748B" 
                    fontSize={10} 
                  />
                  <YAxis 
                    stroke="#64748B" 
                    fontSize={10} 
                    domain={[0, 100]} 
                  />
                  <Tooltip 
                    contentStyle={{ background: '#0F172A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                    labelStyle={{ color: '#94A3B8', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  <Line 
                    name="Health Score" 
                    type="monotone" 
                    dataKey="health" 
                    stroke="#10B981" 
                    strokeWidth={2.5} 
                    dot={{ fill: '#10B981', r: 4 }} 
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    name="Security Score" 
                    type="monotone" 
                    dataKey="security" 
                    stroke="#F43F5E" 
                    strokeWidth={2.5} 
                    dot={{ fill: '#F43F5E', r: 4 }} 
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Card 2: Code Metrics Trends */}
          <GlassCard className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">Codebase & Risk Volume</h3>
              <p className="text-xs text-slate-400">Total lines of code compared to active vulnerability logs</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748B" 
                    fontSize={10} 
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="#3B82F6" 
                    fontSize={10} 
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#F59E0B" 
                    fontSize={10} 
                  />
                  <Tooltip 
                    contentStyle={{ background: '#0F172A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                    labelStyle={{ color: '#94A3B8', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  <Line 
                    yAxisId="left"
                    name="Lines of Code" 
                    type="monotone" 
                    dataKey="loc" 
                    stroke="#3B82F6" 
                    strokeWidth={2.5} 
                    dot={{ fill: '#3B82F6', r: 4 }} 
                  />
                  <Line 
                    yAxisId="right"
                    name="Vulnerabilities" 
                    type="monotone" 
                    dataKey="vulnerabilities" 
                    stroke="#F59E0B" 
                    strokeWidth={2.5} 
                    dot={{ fill: '#F59E0B', r: 4 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Code Architecture distribution metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <GlassCard className="p-4 text-center space-y-1">
          <div className="text-xs text-slate-500 font-bold uppercase">Controllers</div>
          <div className="text-2xl font-extrabold text-indigo-400">{controllersCount}</div>
        </GlassCard>
        <GlassCard className="p-4 text-center space-y-1">
          <div className="text-xs text-slate-500 font-bold uppercase">Services</div>
          <div className="text-2xl font-extrabold text-indigo-400">{servicesCount}</div>
        </GlassCard>
        <GlassCard className="p-4 text-center space-y-1">
          <div className="text-xs text-slate-500 font-bold uppercase">Repositories</div>
          <div className="text-2xl font-extrabold text-indigo-400">{reposCount}</div>
        </GlassCard>
        <GlassCard className="p-4 text-center space-y-1">
          <div className="text-xs text-slate-500 font-bold uppercase">Models</div>
          <div className="text-2xl font-extrabold text-indigo-400">{modelsCount}</div>
        </GlassCard>
      </div>

      {/* AI summaries & roadmaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Project Summary */}
        <GlassCard className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold text-white">AI Project Summary</h3>
            </div>
            <div className="flex items-center gap-2">
              {editSummary ? (
                <>
                  <button
                    onClick={handleSaveSummary}
                    disabled={savingSummary}
                    className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors rounded hover:bg-white/5"
                    title="Save"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSummaryText(selectedProject.summary || '');
                      setEditSummary(false);
                    }}
                    className="p-1 text-rose-400 hover:text-rose-300 transition-colors rounded hover:bg-white/5"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditSummary(true)}
                  className="p-1 text-slate-400 hover:text-white transition-colors rounded hover:bg-white/5"
                  title="Edit Summary"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          {editSummary ? (
            <textarea
              value={summaryText}
              onChange={(e) => setSummaryText(e.target.value)}
              className="w-full h-96 bg-slate-950/60 border border-white/10 rounded-xl p-4 text-slate-300 text-sm focus:outline-none focus:border-indigo-500/50 resize-y font-mono"
            />
          ) : (
            <div className="prose prose-invert text-sm text-slate-300 leading-relaxed max-w-none whitespace-pre-wrap">
              {formatMarkdownText(selectedProject.summary || 'Summary is compiling... Check progress.')}
            </div>
          )}
        </GlassCard>
 
        {/* Onboarding Roadmap */}
        <GlassCard className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold text-white">AI Developer Onboarding Roadmap</h3>
            </div>
            <div className="flex items-center gap-2">
              {editRoadmap ? (
                <>
                  <button
                    onClick={handleSaveRoadmap}
                    disabled={savingRoadmap}
                    className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors rounded hover:bg-white/5"
                    title="Save"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setRoadmapText(selectedProject.learningRoadmap || '');
                      setEditRoadmap(false);
                    }}
                    className="p-1 text-rose-400 hover:text-rose-300 transition-colors rounded hover:bg-white/5"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditRoadmap(true)}
                  className="p-1 text-slate-400 hover:text-white transition-colors rounded hover:bg-white/5"
                  title="Edit Onboarding Roadmap"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          {editRoadmap ? (
            <textarea
              value={roadmapText}
              onChange={(e) => setRoadmapText(e.target.value)}
              className="w-full h-96 bg-slate-950/60 border border-white/10 rounded-xl p-4 text-indigo-300 text-xs focus:outline-none focus:border-indigo-500/50 resize-y font-mono"
            />
          ) : (
            <div className="prose prose-invert text-sm text-slate-300 leading-relaxed max-w-none whitespace-pre-wrap bg-slate-950/45 p-4 rounded-xl border border-white/5 font-mono text-xs">
              {formatMarkdownText(selectedProject.learningRoadmap || 'Roadmap is compiling... Check progress.')}
            </div>
          )}
        </GlassCard>
      </div>

    </div>
  );
};
export default RepoDashboard;
