import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAnalysis } from '../context/AnalysisContext';
import { 
  LayoutDashboard, 
  Binary, 
  Code, 
  MessageSquareCode, 
  ShieldAlert, 
  Layers, 
  FileCheck, 
  Settings, 
  ArrowLeft,
  GitPullRequest
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { selectedProject } = useAnalysis();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Overview', path: '', icon: LayoutDashboard, color: 'text-cyan-400', bg: 'hover:bg-cyan-500/5 hover:text-cyan-300', activeClass: 'from-cyan-600 to-blue-600 shadow-cyan-500/20' },
    { name: 'Visualization', path: 'visualizations', icon: Binary, color: 'text-fuchsia-400', bg: 'hover:bg-fuchsia-500/5 hover:text-fuchsia-300', activeClass: 'from-fuchsia-600 to-pink-600 shadow-fuchsia-500/20' },
    { name: 'Code Explorer', path: 'explorer', icon: Code, color: 'text-amber-400', bg: 'hover:bg-amber-500/5 hover:text-amber-300', activeClass: 'from-amber-600 to-orange-600 shadow-amber-500/20' },
    { name: 'AI Chat', path: 'chat', icon: MessageSquareCode, color: 'text-indigo-400', bg: 'hover:bg-indigo-500/5 hover:text-indigo-300', activeClass: 'from-indigo-600 to-purple-600 shadow-indigo-500/20' },
    { name: 'Security Scan', path: 'security', icon: ShieldAlert, color: 'text-rose-400', bg: 'hover:bg-rose-500/5 hover:text-rose-300', activeClass: 'from-rose-600 to-red-600 shadow-rose-500/20' },
    { name: 'SBOM DB', path: 'sbom', icon: Layers, color: 'text-emerald-400', bg: 'hover:bg-emerald-500/5 hover:text-emerald-300', activeClass: 'from-emerald-600 to-teal-600 shadow-emerald-500/20' },
    { name: 'Reports', path: 'reports', icon: FileCheck, color: 'text-sky-400', bg: 'hover:bg-sky-500/5 hover:text-sky-300', activeClass: 'from-sky-600 to-blue-600 shadow-sky-500/20' },
    { name: 'Change Impact', path: 'impact', icon: GitPullRequest, color: 'text-violet-400', bg: 'hover:bg-violet-500/5 hover:text-violet-300', activeClass: 'from-violet-600 to-purple-600 shadow-violet-500/20' },
    { name: 'Settings', path: 'settings', icon: Settings, color: 'text-slate-400', bg: 'hover:bg-slate-500/5 hover:text-slate-300', activeClass: 'from-slate-600 to-slate-800 shadow-slate-500/20' },
  ];

  if (!selectedProject) return null;

  return (
    <aside className="w-64 glass-container border-r border-white/5 h-screen sticky top-0 flex flex-col justify-between p-4 z-40">
      <div className="space-y-6">
        {/* Project Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-white/5">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h4 className="font-semibold text-white truncate max-w-[150px]">{selectedProject.name}</h4>
            <span className="text-[10px] text-indigo-400 font-medium px-2 py-0.5 bg-indigo-500/10 rounded-full border border-indigo-500/20">
              {selectedProject.type}
            </span>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const targetPath = item.path === '' 
              ? `/project/${selectedProject.id}` 
              : `/project/${selectedProject.id}/${item.path}`;

            return (
              <NavLink
                key={item.name}
                to={targetPath}
                end={item.path === ''}
                className={({ isActive }) => `
                  group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? `bg-gradient-to-r ${item.activeClass} text-white shadow-lg` 
                    : `text-slate-400 ${item.bg}`}
                `}
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`w-5 h-5 transition-colors group-hover:text-white ${isActive ? 'text-white' : item.color}`} />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-900/40 rounded-xl border border-white/5 text-center">
        <div className="text-[11px] text-slate-500">Security Index</div>
        <div className="text-xl font-bold text-emerald-400 mt-0.5">{selectedProject.securityScore}%</div>
      </div>
    </aside>
  );
};
export default Sidebar;
