import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAnalysis } from '../context/AnalysisContext';
import { GlassCard } from '../components/GlassCard';
import { 
  ShieldCheck, 
  ShieldAlert, 
  FileWarning, 
  AlertTriangle,
  Lightbulb,
  ExternalLink
} from 'lucide-react';

export const SecurityScanPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { securityIssues, securityRecommendations, selectedProject } = useAnalysis();

  const highIssues = securityIssues.filter(i => i.severity === 'HIGH');
  const mediumIssues = securityIssues.filter(i => i.severity === 'MEDIUM');
  const lowIssues = securityIssues.filter(i => i.severity === 'LOW');

  const getSeverityStyle = (severity: 'HIGH' | 'MEDIUM' | 'LOW') => {
    switch (severity) {
      case 'HIGH':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'MEDIUM':
        return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      case 'LOW':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Security Audit</h1>
        <p className="text-sm text-slate-400">Vulnerability scans, credential checks, and code-smell flag alerts</p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Score indicator */}
        <GlassCard className="flex flex-col justify-between h-36">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 text-xs font-bold uppercase">Security Rating</span>
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-white">{selectedProject?.securityScore || 100}%</span>
            <span className="text-xs text-emerald-400 font-semibold">Active</span>
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col justify-between h-36">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 text-xs font-bold uppercase">Critical Warnings</span>
            <ShieldAlert className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-red-400">{highIssues.length}</span>
            <span className="text-xs text-red-400 font-medium">Action Required</span>
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col justify-between h-36">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 text-xs font-bold uppercase">Medium Risks</span>
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-yellow-400">{mediumIssues.length}</span>
            <span className="text-xs text-slate-500">Warnings</span>
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col justify-between h-36">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 text-xs font-bold uppercase">Minor Code Smells</span>
            <FileWarning className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-blue-400">{lowIssues.length}</span>
            <span className="text-xs text-slate-500">Flags</span>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Vulnerabilities List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-white mb-2">Detailed Vulnerability Log</h3>
          {securityIssues.length > 0 ? (
            securityIssues.map((issue, idx) => (
              <div 
                key={idx}
                className="glass-card rounded-2xl p-6 border border-white/5 hover:border-indigo-500/20 flex flex-col md:flex-row md:items-start justify-between gap-4 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getSeverityStyle(issue.severity)}`}>
                      {issue.severity}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono px-2 py-0.5 bg-slate-900 rounded border border-white/5 uppercase">
                      {issue.type}
                    </span>
                    <span className="text-slate-500 text-xs">
                      {issue.filePath} {issue.line > 0 ? `: L${issue.line}` : ''}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm leading-snug">{issue.description}</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">**Recommendation**: {issue.recommendation}</p>
                  </div>
                </div>

                {issue.filePath !== 'Dependency Manifest' && (
                  <button
                    onClick={() => navigate(`/project/${id}/explorer`)}
                    className="p-2.5 bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-xl border border-white/5 transition-all self-end md:self-start"
                    title="View file in Monaco Explorer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-slate-900/35 border border-white/5 rounded-2xl">
              <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <h3 className="font-semibold text-white">Clean Bill of Health!</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-2">Our static scan rule engine has identified zero critical secrets, database queries, or xss injections.</p>
            </div>
          )}
        </div>

        {/* AI Recommendations panel */}
        <div className="space-y-6">
          <GlassCard className="space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4">
              <Lightbulb className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Patch Recommendations</h3>
            </div>
            <div className="prose prose-invert text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">
              {securityRecommendations || 'Analyzing patch priorities... Scans require code analysis.'}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
export default SecurityScanPage;
