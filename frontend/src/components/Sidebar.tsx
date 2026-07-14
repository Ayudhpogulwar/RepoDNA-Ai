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
  ArrowLeft 
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { selectedProject } = useAnalysis();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Overview', path: '', icon: LayoutDashboard },
    { name: 'Visualization', path: 'visualizations', icon: Binary },
    { name: 'Code Explorer', path: 'explorer', icon: Code },
    { name: 'AI Chat', path: 'chat', icon: MessageSquareCode },
    { name: 'Security Scan', path: 'security', icon: ShieldAlert },
    { name: 'SBOM DB', path: 'sbom', icon: Layers },
    { name: 'Reports', path: 'reports', icon: FileCheck },
    { name: 'Settings', path: 'settings', icon: Settings },
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
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}
                `}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
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
