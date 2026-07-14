import React from 'react';
import { useAnalysis } from '../context/AnalysisContext';
import { GlassCard } from '../components/GlassCard';
import { 
  Download, 
  ShieldCheck, 
  Workflow, 
  Layers, 
  BookOpen, 
  Award 
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { selectedProject, dependencies, securityIssues } = useAnalysis();

  const categorizeProjectSpecs = (languagesStr: string, frameworksStr: string) => {
    const rawLanguages = languagesStr ? languagesStr.split(', ') : [];
    const rawFrameworks = frameworksStr ? frameworksStr.split(', ') : [];
    
    const programmingLanguagesList: string[] = [];
    const configMarkupList: string[] = [];
    const technologiesList: string[] = [];
    const archComponentsList: string[] = [];
    const frameworksList: string[] = [];
    
    // Categorize languages
    rawLanguages.forEach(lang => {
      const l = lang.trim();
      if (l === 'Plain Text' || !l) return;
      
      if (l === 'JavaScript React' || l === 'React') {
        technologiesList.push('React');
        return;
      }
      if (l === 'TypeScript React') {
        technologiesList.push('React');
        return;
      }
      
      const isProgLang = ['Java', 'JavaScript', 'TypeScript', 'Python', 'SQL', 'C++', 'C', 'C#', 'Go', 'Ruby', 'Rust', 'HTML', 'CSS'].includes(l);
      if (isProgLang) {
        programmingLanguagesList.push(l);
        technologiesList.push(l);
      } else {
        configMarkupList.push(l);
      }
    });
    
    // Categorize frameworks and components
    rawFrameworks.forEach(fw => {
      const f = fw.trim();
      if (!f) return;
      const isArchComp = ['Controllers', 'Services', 'Repositories', 'Models', 'EntryPoints', 'Entry Points'].includes(f);
      if (isArchComp) {
        archComponentsList.push(f === 'EntryPoints' ? 'Entry Points' : f);
      } else {
        frameworksList.push(f);
        technologiesList.push(f);
      }
    });
    
    // De-duplicate technologies
    const uniqueTechnologies = Array.from(new Set(technologiesList));
    
    return {
      programmingLanguages: programmingLanguagesList.join(', ') || 'Java',
      configMarkup: configMarkupList.join(', ') || 'None',
      technologies: uniqueTechnologies.join(', ') || 'Java',
      archComponents: archComponentsList.join(', ') || 'None',
      frameworks: frameworksList.join(', ') || 'None'
    };
  };

  const handleExportMarkdown = (reportType: string) => {
    if (!selectedProject) return;

    let content = `# CodeDNA AI Platform - ${reportType} Report\n`;
    content += `Project Name: ${selectedProject.name}\n`;
    content += `Date Generated: ${new Date().toLocaleDateString()}\n\n`;
    content += `--------------------------------------------------\n\n`;

    const specs = categorizeProjectSpecs(selectedProject.languages || '', selectedProject.frameworks || '');

    if (reportType === 'Security') {
      content += `## Security Index Score: ${selectedProject.securityScore}%\n\n`;
      content += `### List of Flagged Issues:\n`;
      securityIssues.forEach((issue, idx) => {
        content += `${idx + 1}. [${issue.severity}] in ${issue.filePath} - ${issue.description}\n`;
        content += `   *Recommendation: ${issue.recommendation}*\n\n`;
      });
    } else if (reportType === 'Architecture') {
      content += `## Technologies Used: ${specs.technologies}\n`;
      content += `## Configuration/Markup Files: ${specs.configMarkup}\n`;
      content += `## Programming Languages: ${specs.programmingLanguages}\n`;
      if (specs.frameworks && specs.frameworks !== 'None') {
        content += `## Frameworks/Libraries Detected: ${specs.frameworks}\n`;
      }
      if (specs.archComponents && specs.archComponents !== 'None') {
        content += `## Architecture Components Detected: ${specs.archComponents}\n`;
      }
      content += `\n### AI Architectural Summary:\n`;
      content += `${selectedProject.summary || 'Summary compiling...'}\n`;
    } else if (reportType === 'Onboarding') {
      content += `## 5-Day Developer Onboarding Roadmap:\n\n`;
      content += `${selectedProject.learningRoadmap || 'Roadmap compiling...'}\n`;
    } else {
      content += `## Dependency SBOM:\n\n`;
      dependencies.forEach((dep) => {
        content += `- ${dep.name} (${dep.version}) - Type: ${dep.type} - Status: ${dep.vulnerabilityStatus}\n`;
      });
    }

    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(content);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${selectedProject.name}-${reportType.toLowerCase()}-report.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const renderMarkdownAsHtml = (md: string) => {
    if (!md) return '';
    let html = md;
    
    // Convert headers (### title to <h3>title</h3>)
    html = html.replace(/^### (.*?)$/gm, '<h3 style="margin-top: 15px; margin-bottom: 5px; color: #312E81;">$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2 style="margin-top: 20px; margin-bottom: 10px; color: #1E1B4B;">$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1 style="margin-top: 25px; margin-bottom: 15px; color: #1E1B4B;">$1</h1>');
    
    // Convert bold text
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert lists
    html = html.replace(/^\* (.*?)$/gm, '<li style="margin-bottom: 4px;">$1</li>');
    html = html.replace(/^- (.*?)$/gm, '<li style="margin-bottom: 4px;">$1</li>');
    
    // Wrap lists
    html = html.replace(/(<li.*?>.*?<\/li>\s*)+/g, (match) => `<ul style="margin: 5px 0 15px 20px; padding: 0;">${match}</ul>`);
    
    // Convert single newlines to linebreaks
    html = html.replace(/\n/g, '<br/>');
    
    return html;
  };

  const handleExportPDF = (reportType: string) => {
    if (!selectedProject) return;
    const specs = categorizeProjectSpecs(selectedProject.languages || '', selectedProject.frameworks || '');

    let content = `
      <html>
      <head>
        <title>CodeDNA AI - ${reportType} Report</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1E293B; background: #FFF; line-height: 1.6; }
          .header { border-bottom: 2px solid #6366F1; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 28px; font-weight: bold; color: #1E1B4B; margin: 0; }
          .subtitle { font-size: 14px; color: #64748B; margin-top: 5px; }
          .meta-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 15px; margin-top: 20px; font-size: 14px; background: #F8FAFC; padding: 15px; border-radius: 8px; }
          .meta-item { display: flex; justify-content: space-between; border-bottom: 1px solid #E2E8F0; padding-bottom: 5px; }
          .section-title { font-size: 20px; font-weight: bold; color: #4338CA; margin-top: 30px; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px; }
          .issue-card { border: 1px solid #FCA5A5; background: #FEF2F2; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
          .issue-severity { display: inline-block; font-size: 10px; font-weight: bold; padding: 3px 8px; border-radius: 12px; text-transform: uppercase; }
          .severity-high { background: #FECACA; color: #991B1B; }
          .severity-medium { background: #FEF3C7; color: #92400E; }
          .severity-low { background: #E0F2FE; color: #075985; }
          .dep-item { padding: 8px 12px; background: #F8FAFC; border-bottom: 1px solid #E2E8F0; font-size: 13px; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">CodeDNA AI Platform</div>
          <div class="subtitle">Automated Software Intelligence & Static Audit</div>
          <div class="meta-grid">
            <div class="meta-item"><strong>Report Type:</strong> <span>${reportType} Report</span></div>
            <div class="meta-item"><strong>Date:</strong> <span>${new Date().toLocaleDateString()}</span></div>
            <div class="meta-item"><strong>Project:</strong> <span>${selectedProject.name}</span></div>
            <div class="meta-item"><strong>Technologies:</strong> <span>${specs.technologies}</span></div>
          </div>
        </div>
    `;

    if (reportType === 'Security') {
      content += `
        <div class="section-title">Security Audit (Score: ${selectedProject.securityScore}%)</div>
        <p>The following vulnerabilities were detected during the static scanning process:</p>
      `;
      securityIssues.forEach((issue) => {
        const severityClass = issue.severity.toLowerCase() === 'high' ? 'severity-high' : issue.severity.toLowerCase() === 'medium' ? 'severity-medium' : 'severity-low';
        content += `
          <div class="issue-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
              <strong style="font-size:15px; color:#1E293B;">${issue.filePath}</strong>
              <span class="issue-severity ${severityClass}">${issue.severity}</span>
            </div>
            <div style="font-size: 13px; color: #475569; margin-bottom: 8px;">${issue.description}</div>
            <div style="font-size: 12px; color: #1E293B; background: #FFF; padding: 8px; border-radius: 4px; border: 1px dashed #E2E8F0;">
              <strong>Recommendation:</strong> ${issue.recommendation}
            </div>
          </div>
        `;
      });
      if (securityIssues.length === 0) {
        content += `<p style="color:#10B981; font-weight:bold;">No vulnerabilities detected. Your codebase is secure.</p>`;
      }
    } else if (reportType === 'Architecture') {
      content += `
        <div class="section-title">Architecture & System Overview</div>
        <p><strong>Technologies Used:</strong> ${specs.technologies}</p>
        <p><strong>Configuration/Markup Files:</strong> ${specs.configMarkup}</p>
        <p><strong>Programming Languages:</strong> ${specs.programmingLanguages}</p>
      `;
      if (specs.frameworks && specs.frameworks !== 'None') {
        content += `<p><strong>Frameworks/Libraries Detected:</strong> ${specs.frameworks}</p>`;
      }
      if (specs.archComponents && specs.archComponents !== 'None') {
        content += `<p><strong>Architecture Components Detected:</strong> ${specs.archComponents}</p>`;
      }
      content += `
        <div class="section-title">AI System Summary</div>
        <div style="font-size:14px; color:#334155; background:#F8FAFC; padding:20px; border-radius:8px; border:1px solid #E2E8F0;">
          ${renderMarkdownAsHtml(selectedProject.summary || 'Summary compiling...')}
        </div>
      `;
    } else if (reportType === 'Onboarding') {
      content += `
        <div class="section-title">5-Day Developer Onboarding Roadmap</div>
        <p>Use the following AI-guided onboarding path to introduce new engineers to this repository:</p>
        <div style="font-size:14px; color:#334155; background:#F8FAFC; padding:20px; border-radius:8px; border:1px solid #E2E8F0;">
          ${renderMarkdownAsHtml(selectedProject.learningRoadmap || 'Roadmap compiling...')}
        </div>
      `;
    } else {
      content += `
        <div class="section-title">Dependency Software Bill of Materials (SBOM)</div>
        <p>Below is the inventory of libraries and third-party packages declared in this project:</p>
        <div style="border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden;">
      `;
      dependencies.forEach((dep) => {
        content += `
          <div class="dep-item">
            <strong>${dep.name} (${dep.version})</strong>
            <span style="font-size:11px; color:#475569;">Type: ${dep.type} | License: ${dep.license} | ${dep.vulnerabilityStatus}</span>
          </div>
        `;
      });
      content += `</div>`;
    }

    content += `
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const reports = [
    {
      title: 'Architecture & Frameworks',
      desc: 'Includes static module classification details, lines of code, and AI structural system overview.',
      icon: Workflow,
      color: 'text-indigo-400',
      type: 'Architecture'
    },
    {
      title: 'Security Scan Log',
      desc: 'Contains detailed credentials leaks, dynamic SQL strings, open XSS risks, and patch directions.',
      icon: ShieldCheck,
      color: 'text-rose-400',
      type: 'Security'
    },
    {
      title: 'SBOM Inventory',
      desc: 'Outputs lists of all parsed dependencies, package versions, and license details.',
      icon: Layers,
      color: 'text-blue-400',
      type: 'SBOM'
    },
    {
      title: 'Developer Onboarding Guide',
      desc: 'Includes the AI 5-Day roadmap onboarding track for new engineers.',
      icon: BookOpen,
      color: 'text-purple-400',
      type: 'Onboarding'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Platform Reports</h1>
        <p className="text-sm text-slate-400">Export software intelligence reports in Markdown and PDF formats</p>
      </div>

      {/* Reports grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {reports.map((report) => (
          <GlassCard key={report.title} className="flex flex-col justify-between h-64">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-slate-900 border border-white/5 rounded-xl ${report.color}`}>
                  <report.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-base">{report.title}</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{report.desc}</p>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-white/5">
              <button
                onClick={() => handleExportMarkdown(report.type)}
                className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 bg-slate-900 border border-white/5 hover:bg-slate-800 text-white rounded-xl transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Export Markdown</span>
              </button>
              <button
                onClick={() => handleExportPDF(report.type)}
                className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-md shadow-indigo-600/10"
              >
                <Download className="w-4 h-4" />
                <span>Print PDF Report</span>
              </button>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Overview certificate */}
      <GlassCard className="bg-indigo-950/10 border-indigo-500/15 flex items-center gap-4">
        <Award className="w-10 h-10 text-indigo-400 shrink-0" />
        <div>
          <h4 className="font-bold text-white text-sm">Regulatory Compliance Auditing</h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">Generated SPDX and CycloneDX files can be uploaded directly to dependency scanners (like SonarQube or Snyk) to verify security certifications.</p>
        </div>
      </GlassCard>

    </div>
  );
};
export default ReportsPage;
