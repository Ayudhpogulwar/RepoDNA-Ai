import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalysis } from '../context/AnalysisContext';
import { useAuth } from '../context/AuthContext';
import { 
  FolderKanban, 
  ShieldAlert, 
  Activity, 
  Search, 
  Plus, 
  Trash2, 
  ExternalLink,
  HeartPulse
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { projects, fetchProjects, selectProject, deleteProject } = useAnalysis();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSelect = async (projectId: number) => {
    await selectProject(projectId);
    navigate(`/project/${projectId}`);
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Compute metrics
  const totalProjects = projects.length;
  const avgHealth = totalProjects > 0 
    ? Math.round(projects.reduce((acc, curr) => acc + curr.healthScore, 0) / totalProjects) 
    : 100;
  const avgSecurity = totalProjects > 0 
    ? Math.round(projects.reduce((acc, curr) => acc + curr.securityScore, 0) / totalProjects) 
    : 100;

  // Chart data
  const chartData = projects.slice().reverse().map(p => ({
    name: p.name,
    health: p.healthScore,
    security: p.securityScore
  }));

  const mockActivities = [
    { text: 'Analyzed src/main/java/com/petclinic/controller/OwnerController.java', time: '5 mins ago', type: 'scan' },
    { text: 'Generated SPDX SBOM format report for Spring-Petclinic', time: '12 mins ago', type: 'sbom' },
    { text: 'Cloned repository spring-projects/spring-petclinic', time: '15 mins ago', type: 'git' },
    { text: 'Detected SQL Injection vulnerabilities in OwnerController.java:L45', time: '20 mins ago', type: 'alert' }
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0B0F19] p-6 lg:p-8 space-y-8 relative">
      <div className="glow-primary top-[10%] left-[5%]" />
      <div className="glow-secondary bottom-[10%] right-[5%]" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Welcome, {user?.username || 'Developer'}</h1>
          <p className="text-sm text-slate-400">Track and secure your software modules, folders and repositories</p>
        </div>
        <button
          onClick={() => navigate('/upload')}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Analyze Workspace</span>
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
        <GlassCard className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium uppercase">Active Workspaces</div>
            <div className="text-2xl font-bold text-white mt-0.5">{totalProjects}</div>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium uppercase">Average Health</div>
            <div className="text-2xl font-bold text-emerald-400 mt-0.5">{avgHealth}%</div>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium uppercase">Security Score</div>
            <div className="text-2xl font-bold text-rose-400 mt-0.5">{avgSecurity}%</div>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-4">
          <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium uppercase">Recent Flags</div>
            <div className="text-2xl font-bold text-yellow-400 mt-0.5">{totalProjects > 0 ? 4 : 0}</div>
          </div>
        </GlassCard>
      </div>

      {/* Charts & Graphs Row */}
      {totalProjects > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          <GlassCard className="col-span-2 space-y-4">
            <h3 className="font-bold text-white text-lg">Project Performance Matrix</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSecurity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="health" name="Health Score" stroke="#10B981" fillOpacity={1} fill="url(#colorHealth)" strokeWidth={2} />
                  <Area type="monotone" dataKey="security" name="Security Score" stroke="#6366F1" fillOpacity={1} fill="url(#colorSecurity)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard className="space-y-4">
            <h3 className="font-bold text-white text-lg">Complexity Comparison</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                  <Bar dataKey="health" name="Complexity Rating" fill="#EC4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        
        {/* Project List */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center gap-4 bg-slate-900/60 border border-white/5 rounded-2xl px-4 py-3 text-slate-300">
            <Search className="w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search workspaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm w-full outline-none placeholder-slate-600"
            />
          </div>

          <div className="space-y-4">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <div 
                  key={project.id}
                  className="glass-card rounded-2xl p-6 border border-white/5 hover:border-indigo-500/40 hover:-translate-y-0.5 flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-lg">{project.name}</h3>
                      <span className="text-[10px] text-indigo-400 font-semibold px-2 py-0.5 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                        {project.type}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm max-w-lg truncate">{project.description || 'No description provided.'}</p>
                    <div className="text-xs text-slate-500">Created: {new Date(project.createdAt).toLocaleDateString()}</div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Health</span>
                        <span className={`text-base font-bold ${project.healthScore >= 80 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                          {project.healthScore}%
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase">Security</span>
                        <span className={`text-base font-bold ${project.securityScore >= 80 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {project.securityScore}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pl-4 border-l border-white/5">
                      <button 
                        onClick={() => handleSelect(project.id)}
                        className="p-2 bg-indigo-600/15 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-xl border border-indigo-500/20 transition-all"
                        title="Enter Workspace"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteProject(project.id)}
                        className="p-2 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white rounded-xl border border-red-500/20 transition-all"
                        title="Delete Workspace"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 bg-slate-900/35 border border-dashed border-white/5 rounded-2xl">
                <FolderKanban className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <h3 className="font-semibold text-white">No active workspaces</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-2">Upload code, drag folders, or clone repositories to begin security auditing.</p>
              </div>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <GlassCard className="space-y-6">
          <h3 className="font-bold text-white text-lg">System Activity</h3>
          <div className="space-y-4">
            {totalProjects > 0 ? (
              mockActivities.map((act, idx) => (
                <div key={idx} className="flex gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                  <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full mt-1.5 shrink-0 animate-pulse" />
                  <div className="space-y-1">
                    <p className="text-xs text-slate-300 leading-normal">{act.text}</p>
                    <span className="text-[10px] text-slate-500">{act.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-xs text-slate-600 py-10">
                System awaiting first analysis.
              </div>
            )}
          </div>
        </GlassCard>

      </div>
    </div>
  );
};
export default Dashboard;
