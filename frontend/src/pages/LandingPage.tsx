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
  Code2,
  Terminal,
  Activity,
  Boxes,
  Lock
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [gitUrl, setGitUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'graph' | 'security' | 'rag'>('graph');

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
      glowColor: 'group-hover:shadow-[0_0_40px_rgba(59,130,246,0.3)]',
      borderColor: 'group-hover:border-blue-500/50',
      badge: 'Full Repo'
    },
    {
      title: 'Analyze Folder',
      desc: 'Analyze specific modules (e.g. auth, payments, or services). Understand interactions without parent boilerplate.',
      icon: FolderGit,
      color: 'from-purple-500 to-pink-500',
      glowColor: 'group-hover:shadow-[0_0_40px_rgba(168,85,247,0.3)]',
      borderColor: 'group-hover:border-purple-500/50',
      badge: 'Sub-Module'
    },
    {
      title: 'Analyze Single File',
      desc: 'Inspect Java, Python, JS, C++, YAML, and Docker files. Generates code metrics, cyclomatic ratings, and explanation summaries.',
      icon: FileCode2,
      color: 'from-pink-500 to-rose-500',
      glowColor: 'group-hover:shadow-[0_0_40px_rgba(236,72,153,0.3)]',
      borderColor: 'group-hover:border-pink-500/50',
      badge: 'Single File'
    }
  ];

  const metrics = [
    { label: 'Languages Supported', value: '15+', icon: Code2 },
    { label: 'Security Rules Scanned', value: '120+', icon: ShieldCheck },
    { label: 'Diagram Gen Speed', value: '< 2s', icon: Zap },
    { label: 'Accuracy Rating', value: '99.8%', icon: CheckCircle2 },
  ];

  const marqueeItems = [
    '⚡ Real-time AST Parsing',
    '🛡️ Static Vulnerability Audit',
    '📊 CycloneDX & SPDX SBOM Export',
    '🧬 Interactive React Flow Mindmaps',
    '🤖 Local Gemini 1.5 RAG Vector Indexing',
    '🔍 Cyclomatic Complexity Scoring',
    '🚀 Instant GitHub Repo Scanner'
  ];

  return (
    <div className="relative min-h-screen bg-[#0B0F17] overflow-hidden flex flex-col justify-between bg-grid">
      {/* Background neon animated glow orbs */}
      <div className="glow-primary top-[8%] left-[8%] animate-pulse-glow" />
      <div className="glow-secondary top-[40%] right-[5%] animate-pulse-glow" style={{ animationDelay: '2s' }} />
      <div className="glow-accent bottom-[10%] left-[25%] animate-pulse-glow" style={{ animationDelay: '4s' }} />

      {/* Rotating Background Tech HUD Ring */}
      <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] border border-indigo-500/10 rounded-full animate-spin-slow pointer-events-none z-0 border-dashed" />
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] border border-purple-500/10 rounded-full animate-spin-slow pointer-events-none z-0" style={{ animationDirection: 'reverse' }} />

      {/* Floating particles rising upwards */}
      <div className="absolute top-[20%] left-[15%] w-2 h-2 rounded-full bg-indigo-400/40 blur-[1px] animate-particle-1 pointer-events-none" />
      <div className="absolute top-[40%] right-[20%] w-3 h-3 rounded-full bg-purple-400/40 blur-[1px] animate-particle-2 pointer-events-none" />
      <div className="absolute bottom-[30%] left-[45%] w-2.5 h-2.5 rounded-full bg-pink-400/40 blur-[1px] animate-particle-3 pointer-events-none" />

      {/* Animated Floating Radial Ambient Aura behind hero title */}
      <div className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[850px] h-[380px] bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-[130px] pointer-events-none z-0 animate-float-slow" />

      <main className="max-w-7xl mx-auto px-6 pt-20 pb-16 flex-grow flex flex-col items-center justify-center text-center space-y-16 relative z-10">
        
        {/* Hero Section */}
        <div className="space-y-6 max-w-4xl relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-400 text-xs font-bold tracking-wider uppercase mb-2 shadow-lg shadow-indigo-500/10 hover:border-indigo-400/60 transition-all duration-300 backdrop-blur-md animate-ripple cursor-pointer">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" style={{ animationDuration: '4s' }} /> 
            <span className="bg-gradient-to-r from-indigo-300 to-pink-300 bg-clip-text text-transparent">Next-Gen Software Intelligence</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.12]">
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
        <div className="w-full max-w-xl">
          <form 
            onSubmit={handleQuickAnalyze} 
            className="w-full p-2 bg-slate-900/80 border border-indigo-500/30 focus-within:border-indigo-400 rounded-2xl flex items-center gap-2 backdrop-blur-xl transition-all duration-500 focus-within:shadow-[0_0_50px_rgba(99,102,241,0.35)] shadow-2xl hover:border-white/30"
          >
            <div className="pl-3 text-slate-400">
              <Terminal className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
            <input
              type="url"
              placeholder="Paste GitHub repository URL (e.g. https://github.com/...)"
              value={gitUrl}
              onChange={(e) => setGitUrl(e.target.value)}
              className="flex-grow bg-transparent text-white px-3 py-3 outline-none text-sm placeholder-slate-500 font-medium"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-semibold text-sm px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/60 hover:scale-[1.03] active:scale-[0.97]"
            >
              <span>Analyze</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* 🏃 CONTINUOUSLY MOVING INFINITE TICKER MARQUEE BANNER */}
        <div className="w-full overflow-hidden py-3 bg-indigo-950/30 border-y border-indigo-500/20 backdrop-blur-md relative z-10">
          <div className="animate-marquee items-center gap-8">
            {[...marqueeItems, ...marqueeItems].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs font-mono font-semibold text-indigo-300/90 whitespace-nowrap bg-indigo-500/10 px-3.5 py-1 rounded-full border border-indigo-500/20">
                {item}
              </div>
            ))}
          </div>
        </div>


        {/* Live Interactive Feature Scanner Preview Showcase */}
        <div className="w-full max-w-4xl bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden text-left space-y-6">
          {/* Laser scanning beam animation line */}
          <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent blur-[1px] animate-laser-scan pointer-events-none z-20" />
          
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-xs font-mono text-slate-400 pl-2">RepoDNA Live Preview Engine</span>
            </div>

            {/* Interactive Showcase Tabs */}
            <div className="flex items-center bg-slate-950/60 p-1 rounded-xl border border-white/5">
              <button 
                onClick={() => setActiveTab('graph')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${activeTab === 'graph' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                <Boxes className="w-3.5 h-3.5" /> Dependency Graph
              </button>
              <button 
                onClick={() => setActiveTab('security')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${activeTab === 'security' ? 'bg-pink-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                <Lock className="w-3.5 h-3.5" /> Security Audit
              </button>
              <button 
                onClick={() => setActiveTab('rag')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${activeTab === 'rag' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                <Activity className="w-3.5 h-3.5" /> Local RAG AI
              </button>
            </div>
          </div>

          {/* Interactive Tab Content Display */}
          <div className="font-mono text-xs text-slate-300 bg-slate-950/80 p-5 rounded-xl border border-white/5 space-y-3 relative overflow-hidden">
            {activeTab === 'graph' && (
              <div className="space-y-2 animate-fade-in-up">
                <div className="text-indigo-400 font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                  [MAPPING DEPENDENCIES] spring-boot-starter-web -&gt; AnalysisController -&gt; AnalysisService
                </div>
                <p className="text-slate-400">├── Controllers: 4 endpoints detected (REST API)</p>
                <p className="text-slate-400">├── Services: AnalysisService, FileAnalyzerService, GeminiService</p>
                <p className="text-emerald-400">└── CycloneDX &amp; SPDX SBOM generated in 1.2s ✓</p>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-2 animate-fade-in-up">
                <div className="text-pink-400 font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />
                  [STATIC SECURITY AUDIT] 120 AST rules evaluated
                </div>
                <p className="text-emerald-400">✔ No hardcoded API keys detected in repository</p>
                <p className="text-emerald-400">✔ CORS configured safely for authenticated origins</p>
                <p className="text-indigo-300">ℹ Recommendation: Upgrade spring-security to 6.2+ for enhanced JWT validation</p>
              </div>
            )}

            {activeTab === 'rag' && (
              <div className="space-y-2 animate-fade-in-up">
                <div className="text-purple-400 font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                  [LOCAL RAG VECTOR CHAT] Indexing codebase vectors...
                </div>
                <p className="text-slate-300">&gt; Q: How does the repository parse Maven pom.xml files?</p>
                <p className="text-slate-400">A: Maven dependencies are parsed inside `FileAnalyzerService.java` using regex XML extraction to construct node trees.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Banner */}
        <div className="w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((m) => (
            <div 
              key={m.label} 
              className="p-4 rounded-xl bg-slate-900/40 border border-white/5 backdrop-blur-md flex flex-col items-center justify-center space-y-1 hover:border-indigo-500/40 transition-all duration-300 group hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10"
            >
              <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-medium">
                <m.icon className="w-3.5 h-3.5 group-hover:scale-125 transition-transform duration-300" />
                <span>{m.label}</span>
              </div>
              <div className="text-2xl font-extrabold text-white tracking-tight">{m.value}</div>
            </div>
          ))}
        </div>

        {/* 3 Analysis Modes Cards with Floating Micro-Animations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {cards.map((c) => (
            <div key={c.title} className="group">
              <GlassCard 
                className={`text-left flex flex-col justify-between h-84 border border-white/10 transition-all duration-500 hover:-translate-y-3 ${c.borderColor} ${c.glowColor} relative overflow-hidden p-6`}
              >
                {/* Card subtle background gradient glow */}
                <div className="absolute top-0 right-0 w-36 h-36 bg-white/5 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/20 transition-colors duration-500" />

                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${c.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                      <c.icon className="w-6 h-6 animate-float" />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 group-hover:text-white transition-colors">
                      {c.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-200 transition-colors">{c.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{c.desc}</p>
                </div>
                
                <Link 
                  to="/login?redirect=upload"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors group/link mt-6"
                >
                  <span>Get started</span>
                  <ArrowRight className="w-4 h-4 group-hover/link:translate-x-2 transition-transform" />
                </Link>
              </GlassCard>
            </div>
          ))}
        </div>

        {/* Platform Features Grid */}
        <div className="border-t border-white/10 pt-16 w-full space-y-12">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-white tracking-tight">Full-Stack Intelligence Features</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">Everything you need to inspect, understand, and audit modern software projects in one place.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-md space-y-3 text-left hover:border-indigo-500/40 transition-all duration-300 hover:-translate-y-1.5 group hover:shadow-xl hover:shadow-indigo-500/10">
              <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 w-fit group-hover:scale-110 transition-transform"><Workflow className="w-5 h-5" /></div>
              <h4 className="font-bold text-white text-base">Interactive Architecture Maps</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Zoom and pan through React Flow mind maps and Mermaid class diagrams linked directly to Monaco code paths.</p>
            </div>
            
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-md space-y-3 text-left hover:border-pink-500/40 transition-all duration-300 hover:-translate-y-1.5 group hover:shadow-xl hover:shadow-pink-500/10">
              <div className="p-2.5 bg-pink-500/10 rounded-xl text-pink-400 w-fit group-hover:scale-110 transition-transform"><ShieldCheck className="w-5 h-5" /></div>
              <h4 className="font-bold text-white text-base">Static Security Scans</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Exposes hardcoded credentials, dynamic SQL strings, open redirect packages, and generates patch recommendations.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-md space-y-3 text-left hover:border-purple-500/40 transition-all duration-300 hover:-translate-y-1.5 group hover:shadow-xl hover:shadow-purple-500/10">
              <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-400 w-fit group-hover:scale-110 transition-transform"><Cpu className="w-5 h-5" /></div>
              <h4 className="font-bold text-white text-base">Context-Aware Chat (RAG)</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Queries files locally using cosine similarity indexing. Avoids sending full code directories to LLMs.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-md space-y-3 text-left hover:border-blue-500/40 transition-all duration-300 hover:-translate-y-1.5 group hover:shadow-xl hover:shadow-blue-500/10">
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

