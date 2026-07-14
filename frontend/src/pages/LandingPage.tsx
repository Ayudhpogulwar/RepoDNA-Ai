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
  FileText 
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
    },
    {
      title: 'Analyze Folder',
      desc: 'Analyze specific modules (e.g. auth, payments, or services). Understand interactions without parent boilerplate.',
      icon: FolderGit,
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Analyze Single File',
      desc: 'Inspect Java, Python, JS, C++, YAML, and Docker files. Generates code metrics, cyclomatic ratings, and explanation summaries.',
      icon: FileCode2,
      color: 'from-pink-500 to-rose-500',
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#0B0F19] overflow-hidden flex flex-col justify-between">
      {/* Background neon glows */}
      <div className="glow-primary top-[10%] left-[5%]" />
      <div className="glow-secondary top-[40%] right-[10%]" />
      <div className="glow-accent bottom-[15%] left-[20%]" />

      <main className="max-w-7xl mx-auto px-6 pt-20 pb-16 flex-grow flex flex-col items-center justify-center text-center space-y-16 relative z-10">
        
        {/* Hero Section */}
        <div className="space-y-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-semibold tracking-wider uppercase mb-2">
            <Cpu className="w-3.5 h-3.5" /> Next-Gen Software Intelligence
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-tight">
            Decipher and Map Your <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
              Codebase in Seconds
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Go beyond code generation. Automatically audit security issues, compile dependency SBOMs, build interactive flowcharts, and run local RAG queries on your workspace.
          </p>
        </div>

        {/* Quick URL Input */}
        <form onSubmit={handleQuickAnalyze} className="w-full max-w-lg p-2 bg-slate-900/60 border border-white/5 rounded-2xl flex items-center gap-2 backdrop-blur-md">
          <input
            type="url"
            placeholder="Enter public GitHub Repository URL..."
            value={gitUrl}
            onChange={(e) => setGitUrl(e.target.value)}
            className="flex-grow bg-transparent text-white px-4 py-3 outline-none text-sm placeholder-slate-500"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
          >
            <span>Analyze</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 3 Analysis Modes Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {cards.map((c) => (
            <GlassCard key={c.title} className="text-left flex flex-col justify-between h-72">
              <div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${c.color} flex items-center justify-center text-white shadow-md shadow-indigo-500/10 mb-6`}>
                  <c.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{c.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{c.desc}</p>
              </div>
              <Link 
                to="/login?redirect=upload"
                className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors group mt-4"
              >
                <span>Get started</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </GlassCard>
          ))}
        </div>

        {/* Platform Features Grid */}
        <div className="border-t border-white/5 pt-16 w-full space-y-12">
          <h2 className="text-3xl font-bold text-white">Full-Stack Intelligence Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3 text-left">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 w-fit"><Workflow className="w-5 h-5" /></div>
              <h4 className="font-bold text-white text-base">Interactive Architecture Maps</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Zoom and pan through React Flow mind maps and Mermaid class diagrams linked directly to Monaco code paths.</p>
            </div>
            <div className="space-y-3 text-left">
              <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400 w-fit"><ShieldCheck className="w-5 h-5" /></div>
              <h4 className="font-bold text-white text-base">Static Security Scans</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Exposes hardcoded credentials, dynamic SQL strings, open redirect packages, and generates patch recommendations.</p>
            </div>
            <div className="space-y-3 text-left">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 w-fit"><Cpu className="w-5 h-5" /></div>
              <h4 className="font-bold text-white text-base">Context-Aware Chat (RAG)</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Queries files locally using cosine similarity indexing. Avoids sending full code directories to LLMs.</p>
            </div>
            <div className="space-y-3 text-left">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 w-fit"><FileText className="w-5 h-5" /></div>
              <h4 className="font-bold text-white text-base">SBOM Exporter</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Tracks open-source packages, extracts licenses, and exports CycloneDX and SPDX files for security audits.</p>
            </div>
          </div>
        </div>

      </main>

      <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-600 z-10">
        © 2026 CodeDNA AI Platform. Built for developers, architects, and security audits.
      </footer>
    </div>
  );
};
export default LandingPage;
