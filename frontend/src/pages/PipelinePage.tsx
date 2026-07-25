import React, { useState, useEffect, useRef } from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import { GlassCard } from '../components/GlassCard';
import { 
  Play, 
  Activity, 
  Terminal as TerminalIcon, 
  Loader2, 
  GitBranch, 
  Clock, 
  Cpu, 
  Check 
} from 'lucide-react';

interface Stage {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'passed' | 'failed';
  duration: string;
  logs: string[];
}

export const PipelinePage: React.FC = () => {
  const { selectedProject } = useAnalysis();

  const [pipelineStatus, setPipelineStatus] = useState<'idle' | 'running' | 'passed' | 'failed'>('idle');
  const [currentStageIdx, setCurrentStageIdx] = useState<number>(-1);
  const [pipelineLogs, setPipelineLogs] = useState<string[]>(['[SYSTEM] Pipeline Idle. Waiting for trigger...']);
  const [buildTime, setBuildTime] = useState<string>('N/A');
  const [testCount, setTestCount] = useState<string>('N/A');

  const consoleEndRef = useRef<HTMLDivElement>(null);

  const initialStages: Stage[] = [
    { 
      id: 'checkout', 
      name: 'Source Checkout', 
      status: 'idle', 
      duration: '0.8s', 
      logs: [
        '[INFO] Initializing git checkout environment...',
        `[INFO] Connecting to GitHub repo...`,
        `[INFO] Pulling commit hash from branch main...`,
        '[SUCCESS] Fetched files: 36 codebase components checked out successfully.'
      ]
    },
    { 
      id: 'build', 
      name: 'Maven Compile', 
      status: 'idle', 
      duration: '3.4s', 
      logs: [
        '[INFO] Resolving dependency packages...',
        '[INFO] Executing compiler command: mvn clean compile -DskipTests',
        '[INFO] Compilation target: Java JDK 21 (Eclipse Temurin)',
        '[SUCCESS] Maven compile finished with 0 warnings.'
      ]
    },
    { 
      id: 'test', 
      name: 'Unit Tests', 
      status: 'idle', 
      duration: '2.1s', 
      logs: [
        '[INFO] Running unit testing suite...',
        '[INFO] Active testrunner: JUnit 5 Engine',
        '[TEST] Running PetclinicApplicationTests.java - Passed',
        '[TEST] Running OwnerControllerTests.java - Passed',
        '[SUCCESS] Test Results: 36 tests run, 36 passed, 0 failed.'
      ]
    },
    { 
      id: 'security', 
      name: 'Security Scan', 
      status: 'idle', 
      duration: '1.5s', 
      logs: [
        '[INFO] Running static vulnerability scanner...',
        '[INFO] Scanning class mappings for SQL injections and credential leaks...',
        '[SUCCESS] Static Scan: No critical secrets leaked in environment configs.'
      ]
    },
    { 
      id: 'deploy', 
      name: 'Aiven Deploy', 
      status: 'idle', 
      duration: '1.2s', 
      logs: [
        '[INFO] Preparing compiled container assembly...',
        '[INFO] Connecting to cloud endpoint on Aiven Cloud database...',
        '[INFO] Re-seeding tables and flushing transaction routes...',
        '[SUCCESS] Deployment complete: Deployed version active at live production URL.'
      ]
    }
  ];

  const [stages, setStages] = useState<Stage[]>(initialStages);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [pipelineLogs]);

  const runPipeline = () => {
    if (pipelineStatus === 'running') return;

    setPipelineStatus('running');
    setBuildTime('Calculating...');
    setTestCount('Running...');
    setPipelineLogs(['[START] Triggering CI/CD build run for project: ' + (selectedProject?.name || 'Workspace')]);
    
    // Reset stages
    setStages(initialStages.map(s => ({ ...s, status: 'idle' })));
    setCurrentStageIdx(0);
  };

  useEffect(() => {
    if (pipelineStatus !== 'running' || currentStageIdx < 0 || currentStageIdx >= stages.length) {
      if (currentStageIdx === stages.length && pipelineStatus === 'running') {
        setPipelineStatus('passed');
        setBuildTime('9.0 seconds');
        setTestCount('36/36 Passed');
        setPipelineLogs(prev => [...prev, '[SUCCESS] All stages passed! Production build is online.']);
      }
      return;
    }

    const stage = stages[currentStageIdx];
    
    // Set stage to running
    setStages(prev => prev.map((s, idx) => idx === currentStageIdx ? { ...s, status: 'running' } : s));
    setPipelineLogs(prev => [...prev, `\n>>>>> ENTERING STAGE: ${stage.name} <<<<<`]);

    let logLineIdx = 0;
    const logInterval = setInterval(() => {
      if (logLineIdx < stage.logs.length) {
        setPipelineLogs(prev => [...prev, stage.logs[logLineIdx]]);
        logLineIdx++;
      } else {
        clearInterval(logInterval);
        
        // Pass the stage
        setStages(prev => prev.map((s, idx) => idx === currentStageIdx ? { ...s, status: 'passed' } : s));
        setCurrentStageIdx(prev => prev + 1);
      }
    }, 500);

    return () => clearInterval(logInterval);
  }, [pipelineStatus, currentStageIdx]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">CI/CD Build Pipeline</h1>
          <p className="text-sm text-slate-400">Automate codebase integration, dependency security, and cloud deployment flows</p>
        </div>
        
        <button
          onClick={runPipeline}
          disabled={pipelineStatus === 'running'}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-semibold transition-all border border-indigo-400/20 shadow-lg shadow-indigo-600/15 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pipelineStatus === 'running' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Pipeline Running...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Trigger Build Pipeline</span>
            </>
          )}
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <GlassCard className="p-5 flex flex-col justify-between h-28">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>PIPELINE STATUS</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2">
            <span className={`text-xl font-extrabold uppercase ${
              pipelineStatus === 'passed' ? 'text-emerald-400' :
              pipelineStatus === 'running' ? 'text-indigo-400 animate-pulse' :
              pipelineStatus === 'failed' ? 'text-rose-400' : 'text-slate-400'
            }`}>
              {pipelineStatus === 'idle' ? 'Ready' : pipelineStatus}
            </span>
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col justify-between h-28">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>ACTIVE BUILD TARGET</span>
            <GitBranch className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-white font-bold text-lg truncate">
            branch: <span className="text-cyan-400 font-mono">main</span>
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col justify-between h-28">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>BUILD DURATION</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-white font-extrabold text-xl">
            {buildTime}
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col justify-between h-28">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>JUNIT TEST RATE</span>
            <Cpu className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-white font-extrabold text-xl">
            {testCount}
          </div>
        </GlassCard>
      </div>

      {/* Horizontal Pipeline stages visual */}
      <GlassCard className="p-8 space-y-6">
        <h3 className="text-base font-bold text-white">Integration Stages Flow</h3>
        
        <div className="relative flex flex-col md:flex-row justify-between items-center gap-8 md:gap-4 py-4">
          {/* Connector Line on Desktop */}
          <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-800 -translate-y-1/2 hidden md:block z-0" />
          
          {stages.map((stage, idx) => {
            const isStagePassed = stage.status === 'passed';
            const isStageRunning = stage.status === 'running';

            return (
              <div key={stage.id} className="relative z-10 flex flex-col items-center text-center space-y-3 md:w-1/5 group">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
                  isStagePassed ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' :
                  isStageRunning ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 animate-pulse' :
                  'bg-slate-950 border-white/5 text-slate-500'
                }`}>
                  {isStagePassed ? (
                    <Check className="w-5 h-5" />
                  ) : isStageRunning ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span className="text-xs font-bold font-mono">0{idx + 1}</span>
                  )}
                </div>

                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white">{stage.name}</div>
                  <div className="text-[10px] text-slate-500 font-semibold">{stage.duration}</div>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Console log simulator */}
      <GlassCard className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <TerminalIcon className="w-5 h-5 text-indigo-400" />
            <span>Deployment Server logs</span>
          </h3>
          <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest">
            STDOUT / STDERR
          </span>
        </div>

        <div className="font-mono text-[11px] bg-slate-950/80 border border-white/5 rounded-xl p-4 h-64 overflow-y-auto space-y-1.5 text-slate-300 scrollbar-thin selection:bg-indigo-500/30">
          {pipelineLogs.map((log, idx) => {
            const isSuccess = log.includes('[SUCCESS]') || log.includes('passed!');
            const isInfo = log.includes('[INFO]');
            const isStage = log.includes('>>>>>');

            let textColor = 'text-slate-300';
            if (isSuccess) textColor = 'text-emerald-400 font-semibold';
            else if (isInfo) textColor = 'text-slate-400';
            else if (isStage) textColor = 'text-indigo-400 font-bold tracking-wide mt-2 block';

            return (
              <div key={idx} className={`${textColor} leading-relaxed`}>
                {log}
              </div>
            );
          })}
          <div ref={consoleEndRef} />
        </div>
      </GlassCard>
    </div>
  );
};

export default PipelinePage;
