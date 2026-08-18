import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  GitBranch, 
  FolderGit, 
  FileCode2, 
  ArrowRight, 
  ShieldCheck, 
  Cpu, 
  Workflow, 
  FileText,
  Sparkles,
  Zap,
  CheckCircle2,
  Code2
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [gitUrl, setGitUrl] = useState('');

  const handleQuickAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (gitUrl) {
      navigate('/login?redirect=upload&url=' + encodeURIComponent(gitUrl));
    } else {
      navigate('/login?redirect=upload');
    }
  };

  const cards = [
    {
      title: 'Analyze Repository',
      desc: 'Connect a public GitHub repo or upload a ZIP archive. Maps package dependencies and controller endpoints.',
      icon: GitBranch,
      color: 'from-blue-500 to-indigo-500',
      glowColor: 'group-hover:shadow-[0_0_35px_rgba(59,130,246,0.25)]',
      borderColor: 'group-hover:border-blue-500/50',
      delay: 'animation-delay-200'
    },
    {
      title: 'Analyze Folder',
      desc: 'Analyze specific modules (e.g. auth, payments, or services). Understand interactions without parent boilerplate.',
      icon: FolderGit,
      color: 'from-purple-500 to-pink-500',
      glowColor: 'group-hover:shadow-[0_0_35px_rgba(168,85,247,0.25)]',
      borderColor: 'group-hover:border-purple-500/50',
      delay: 'animation-delay-300'
    },
    {
      title: 'Analyze Single File',
      desc: 'Inspect Java, Python, JS, C++, YAML, and Docker files. Generates code metrics, cyclomatic ratings, and explanation summaries.',
      icon: FileCode2,
      color: 'from-pink-500 to-rose-500',
      glowColor: 'group-hover:shadow-[0_0_35px_rgba(236,72,153,0.25)]',
      borderColor: 'group-hover:border-pink-500/50',
      delay: 'animation-delay-400'
    }
  ];

  const metrics = [
    { label: 'Languages Supported', value: '15+', icon: Code2 },
    { label: 'Security Rules Scanned', value: '120+', icon: ShieldCheck },
    { label: 'Diagram Gen Speed', value: '< 2s', icon: Zap },
    { label: 'Accuracy Rating', value: '99.8%', icon: CheckCircle2 },
  ];

  return (
    <div className="relative min-h-screen bg-[#111827] overflow-hidden flex flex-col justify-between bg-grid">
      {/* Background neon animated glow orbs */}
      <div className="glow-primary top-[10%] left-[5%] animate-pulse-glow" />
      <div className="glow-secondary top-[40%] right-[10%] animate-pulse-glow" style={{ animationDelay: '2s' }} />
      <div className="glow-accent bottom-[15%] left-[20%] animate-pulse-glow" style={{ animationDelay: '4s' }} />

      {/* Animated Floating Radial Ambient Aura behind hero title */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-tr from-indigo-500/15 via-purple-500/15 to-pink-500/15 rounded-full blur-[120px] pointer-events-none z-0 animate-float-slow" />

      <main className="max-w-7xl mx-auto px-6 pt-24 pb-20 flex-grow flex flex-col items-center justify-center text-center space-y-16 relative z-10">
        
        {/* Hero Section */}
        <div className="space-y-6 max-w-4xl relative z-10 opacity-0 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-400 text-xs font-bold tracking-wider uppercase mb-2 shadow-lg shadow-indigo-500/10 hover:border-indigo-400/50 transition-all duration-300 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> 
            <span>Next-Gen Software Intelligence</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.15]">
            Decipher and Map Your <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 via-pink-400 to-indigo-400 bg-clip-text text-transparent animate-text-shimmer">
              Codebase in Seconds
            </span>
          </h1>

          <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Go beyond code generation. Automatically audit security issues, compile dependency SBOMs, build interactive flowcharts, and run local RAG queries on your workspace.
          </p>
        </div>

        {/* Quick URL Input with Animated Pulse Focus */}
        <div className="w-full max-w-xl opacity-0 animate-fade-in-up animation-delay-100">
          <form 
            onSubmit={handleQuickAnalyze} 
            className="w-full p-2 bg-slate-900/80 border border-white/10 focus-within:border-indigo-500/60 rounded-2xl flex items-center gap-2 backdrop-blur-xl transition-all duration-500 focus-within:shadow-[0_0_45px_rgba(99,102,241,0.3)] shadow-2xl hover:border-white/20"
          >
            <input
              type="url"
              placeholder="Paste GitHub repository URL (e.g. https://github.com/...)"
              value={gitUrl}
              onChange={(e) => setGitUrl(e.target.value)}
              className="flex-grow bg-transparent text-white px-4 py-3 outline-none text-sm placeholder-slate-500 font-medium"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Analyze</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Floating Quick Stats Banner */}
        <div className="w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-4 opacity-0 animate-fade-in-up animation-delay-200">
          {metrics.map((m) => (
            <div 
              key={m.label} 
              className="p-4 rounded-xl bg-slate-900/40 border border-white/5 backdrop-blur-md flex flex-col items-center justify-center space-y-1 hover:border-indigo-500/30 transition-all duration-300 group hover:-translate-y-1"
            >
              <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-medium">
                <m.icon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span>{m.label}</span>
              </div>
              <div className="text-2xl font-extrabold text-white tracking-tight">{m.value}</div>
            </div>
          ))}
        </div>

        {/* 3 Analysis Modes Cards with Floating Micro-Animations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {cards.map((c) => (
            <div 
              key={c.title} 
              className={`group opacity-0 animate-fade-in-up ${c.delay}`}
            >
              <GlassCard 
                className={`text-left flex flex-col justify-between h-80 border border-white/5 transition-all duration-500 hover:-translate-y-3 ${c.borderColor} ${c.glowColor} relative overflow-hidden`}
              >
                {/* Card subtle background gradient glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/10 transition-colors duration-500" />

                <div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${c.color} flex items-center justify-center text-white shadow-md mb-6 group-hover:scale-110 transition-transform duration-500`}>
                    <c.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-200 transition-colors">{c.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{c.desc}</p>
                </div>
                
                <Link 
                  to="/login?redirect=upload"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors group/link mt-4"
                >
                  <span>Get started</span>
                  <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1.5 transition-transform" />
                </Link>
              </GlassCard>
            </div>
          ))}
        </div>

        {/* Platform Features Grid */}
        <div className="border-t border-white/5 pt-16 w-full space-y-12 opacity-0 animate-fade-in-up animation-delay-500">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-white tracking-tight">Full-Stack Intelligence Features</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">Everything you need to inspect, understand, and audit modern software projects in one place.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-md space-y-3 text-left hover:border-indigo-500/40 transition-all duration-300 hover:-translate-y-1 group">
              <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 w-fit group-hover:scale-110 transition-transform"><Workflow className="w-5 h-5" /></div>
              <h4 className="font-bold text-white text-base">Interactive Architecture Maps</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Zoom and pan through React Flow mind maps and Mermaid class diagrams linked directly to Monaco code paths.</p>
            </div>
            
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-md space-y-3 text-left hover:border-pink-500/40 transition-all duration-300 hover:-translate-y-1 group">
              <div className="p-2.5 bg-pink-500/10 rounded-xl text-pink-400 w-fit group-hover:scale-110 transition-transform"><ShieldCheck className="w-5 h-5" /></div>
              <h4 className="font-bold text-white text-base">Static Security Scans</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Exposes hardcoded credentials, dynamic SQL strings, open redirect packages, and generates patch recommendations.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-md space-y-3 text-left hover:border-purple-500/40 transition-all duration-300 hover:-translate-y-1 group">
              <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-400 w-fit group-hover:scale-110 transition-transform"><Cpu className="w-5 h-5" /></div>
              <h4 className="font-bold text-white text-base">Context-Aware Chat (RAG)</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Queries files locally using cosine similarity indexing. Avoids sending full code directories to LLMs.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-md space-y-3 text-left hover:border-blue-500/40 transition-all duration-300 hover:-translate-y-1 group">
              <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 w-fit group-hover:scale-110 transition-transform"><FileText className="w-5 h-5" /></div>
              <h4 className="font-bold text-white text-base">SBOM Exporter</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Tracks open-source packages, extracts licenses, and exports CycloneDX and SPDX files for security audits.</p>
            </div>
          </div>
        </div>

      </main>

      <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-500 z-10 backdrop-blur-md">
        © 2026 RepoDNA-Ai Platform. Built for developers, architects, and security audits.
      </footer>
    </div>
  );
};

export default LandingPage;

