import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAnalysis } from '../context/AnalysisContext';
import { GlassCard } from '../components/GlassCard';
import { 
  Layers, 
  Search, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Skull
} from 'lucide-react';

export const SbomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { dependencies, selectedProject } = useAnalysis();
  
  const [searchQuery, setSearchQuery] = useState('');

  const getStatusBadge = (status: 'SECURE' | 'OUTDATED' | 'VULNERABLE') => {
    switch (status) {
      case 'SECURE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Secure</span>
          </span>
        );
      case 'OUTDATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Outdated</span>
          </span>
        );
      case 'VULNERABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <Skull className="w-3.5 h-3.5" />
            <span>Vulnerable</span>
          </span>
        );
    }
  };

  const handleExport = async (format: 'cyclonedx' | 'spdx') => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api';
      const res = await fetch(`${API_BASE}/projects/${id}/sbom/report`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('codedna_token')}`,
        }
      });
      if (res.ok && res.status !== 204) {
        const report = await res.json();
        downloadJsonFile(report.content, `${selectedProject?.name || 'project'}-sbom-${format}.json`);
      } else {
        throw new Error('Fallback to client side generator');
      }
    } catch {
      // Client-side fallback generator
      const mockSbom = {
        bomFormat: format === 'cyclonedx' ? 'CycloneDX' : 'SPDX',
        specVersion: format === 'cyclonedx' ? '1.5' : 'SPDX-2.3',
        project: selectedProject?.name || 'Spring-Petclinic',
        timestamp: new Date().toISOString(),
        dependencies: dependencies.map(d => ({
          name: d.name,
          version: d.version,
          type: d.type,
          license: d.license,
          status: d.vulnerabilityStatus
        }))
      };
      downloadJsonFile(JSON.stringify(mockSbom, null, 2), `${selectedProject?.name || 'project'}-sbom-${format}.json`);
    }
  };

  const downloadJsonFile = (content: string, fileName: string) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(content);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredDeps = dependencies.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Software Bill of Materials (SBOM)</h1>
          <p className="text-sm text-slate-400">Database of parsed packages, licenses, and library versions</p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleExport('cyclonedx')}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 bg-slate-900/60 hover:bg-slate-800 border border-white/5 text-slate-300 hover:text-white rounded-xl transition-all"
          >
            <Download className="w-4 h-4" />
            <span>CycloneDX JSON</span>
          </button>
          <button
            onClick={() => handleExport('spdx')}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 bg-slate-900/60 hover:bg-slate-800 border border-white/5 text-slate-300 hover:text-white rounded-xl transition-all"
          >
            <Download className="w-4 h-4" />
            <span>SPDX JSON</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <GlassCard className="p-0 overflow-hidden border border-white/5 rounded-2xl">
        {/* Table Search Header */}
        <div className="p-4 border-b border-white/5 bg-slate-950/20 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search SBOM packages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none text-sm w-full placeholder-slate-600 text-white"
          />
        </div>

        {/* Dependency Table list */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-slate-900/40 text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-4 pl-6">Package Name</th>
                <th className="p-4">Version</th>
                <th className="p-4">Registry Type</th>
                <th className="p-4">License</th>
                <th className="p-4 pr-6">Scan Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredDeps.length > 0 ? (
                filteredDeps.map((dep) => (
                  <tr key={dep.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="p-4 pl-6 font-semibold text-white">{dep.name}</td>
                    <td className="p-4 font-mono">{dep.version}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-slate-800 border border-white/5 rounded text-[10px] uppercase font-bold text-slate-400">
                        {dep.type}
                      </span>
                    </td>
                    <td className="p-4">{dep.license || 'Unknown'}</td>
                    <td className="p-4 pr-6">{getStatusBadge(dep.vulnerabilityStatus)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-slate-500 font-medium">
                    <Layers className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <span>No dependencies matched search query.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};
export default SbomPage;
