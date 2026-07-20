import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAnalysis } from '../context/AnalysisContext';
import { 
  GitBranch, 
  FolderGit, 
  FileCode2, 
  UploadCloud, 
  ArrowLeft,
  ShieldCheck,
  Dna
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import Editor from '@monaco-editor/react';

type UploadMode = 'repository' | 'folder' | 'file';

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { createProject, uploadCode, triggerAnalysis } = useAnalysis();

  const [mode, setMode] = useState<UploadMode>('repository');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [gitUrl, setGitUrl] = useState(searchParams.get('url') || '');
  const [fileName, setFileName] = useState('MyClass.java');
  const [fileLanguage, setFileLanguage] = useState('Java');
  const [fileContent, setFileContent] = useState(`public class MyClass {
    // Paste your code here to analyze it
    public void processData(String username) {
        String query = "SELECT * FROM users WHERE name = " + username;
        // Run DNA security scan on me!
    }
}`);
  const [loading, setLoading] = useState(false);
  const [folderFiles, setFolderFiles] = useState<File[]>([]);

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setFolderFiles(filesArray);
      
      // Auto-set workspace name to parent folder name
      if (filesArray.length > 0) {
        const firstFile = filesArray[0];
        const relativePath = firstFile.webkitRelativePath || '';
        const folderName = relativePath.split('/')[0] || 'Uploaded Folder';
        setName(folderName);
        setDescription(`Local folder workspace uploaded with ${filesArray.length} files.`);
      }
    }
  };

  const handleModeChange = (newMode: UploadMode) => {
    setMode(newMode);
    setFolderFiles([]);
    if (newMode === 'file') {
      setName('Single File Scan');
      setDescription('DNA Scan on single file code block');
    } else {
      setName('');
      setDescription('');
    }
  };

  const handleStartAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const projectType = mode === 'repository' ? 'REPOSITORY' : mode === 'folder' ? 'FOLDER' : 'FILE';
    const project = await createProject(
      name || (mode === 'repository' ? 'New Repository' : 'New Folder'),
      projectType,
      mode === 'repository' ? gitUrl : '',
      description
    );

    if (project) {
      if (mode === 'file') {
        // Upload the pasted file content
        await uploadCode(project.id, fileName, fileContent, fileLanguage);
      } else if (mode === 'folder' && folderFiles.length > 0) {
        // Map extensions to language names
        const extMap: Record<string, string> = {
          'java': 'Java',
          'py': 'Python',
          'js': 'JavaScript',
          'jsx': 'JavaScript React',
          'ts': 'TypeScript',
          'tsx': 'TypeScript React',
          'xml': 'XML',
          'yml': 'YAML',
          'yaml': 'YAML',
          'json': 'JSON',
          'md': 'Markdown',
          'html': 'HTML',
          'css': 'CSS',
          'cpp': 'C++',
          'c': 'C',
          'h': 'C/C++ Header',
          'dockerfile': 'Dockerfile'
        };

        for (const file of folderFiles) {
          try {
            const content = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = () => reject(reader.error);
              reader.readAsText(file);
            });
            
            const ext = file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase();
            const lang = extMap[ext] || 'Plain Text';
            const relativePath = file.webkitRelativePath || file.name;
            
            await uploadCode(project.id, relativePath, content, lang);
          } catch (err) {
            console.error(`Failed to read file: ${file.name}`, err);
          }
        }
      }
      
      // Trigger analysis
      await triggerAnalysis(project.id);
      
      // Redirect to progress page
      navigate(`/project/${project.id}/progress`);
    } else {
      setLoading(false);
      alert('Analysis setup failed. Check backend configuration.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#111827] p-6 lg:p-8 flex flex-col items-center justify-center relative">
      <div className="glow-primary top-[15%] left-[10%]" />
      <div className="glow-secondary bottom-[15%] right-[10%]" />

      <div className="w-full max-w-4xl space-y-6 relative z-10">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form container */}
          <div className="lg:col-span-2 space-y-6">
            <GlassCard className="p-8 space-y-6">
              <h2 className="text-2xl font-bold text-white">Create Analysis Workspace</h2>
              
              <div className="flex gap-4 border-b border-white/5 pb-4">
                <button
                  type="button"
                  onClick={() => handleModeChange('repository')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${mode === 'repository' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  <GitBranch className="w-4 h-4" />
                  <span>GitHub URL</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('folder')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${mode === 'folder' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  <FolderGit className="w-4 h-4" />
                  <span>Local Folder</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('file')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${mode === 'file' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  <FileCode2 className="w-4 h-4" />
                  <span>Paste Code</span>
                </button>
              </div>

              <form onSubmit={handleStartAnalysis} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Workspace / Project Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. spring-petclinic"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Description (Optional)</label>
                  <textarea
                    placeholder="Workspace purpose or branch specifications..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
                  />
                </div>

                {mode === 'repository' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">GitHub Clone HTTP URL</label>
                    <input
                      type="url"
                      required
                      placeholder="https://github.com/username/project.git"
                      value={gitUrl}
                      onChange={(e) => setGitUrl(e.target.value)}
                      className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
                    />
                  </div>
                )}

                {mode === 'folder' && (
                  <div className="p-8 border border-dashed border-white/10 rounded-2xl bg-slate-950/20 text-center space-y-4">
                    <UploadCloud className="w-12 h-12 text-slate-500 mx-auto" />
                    <div>
                      <h4 className="font-semibold text-white">Select Folder</h4>
                      {folderFiles.length > 0 ? (
                        <p className="text-xs text-emerald-400 mt-1">✓ {folderFiles.length} files selected in "{name}" folder</p>
                      ) : (
                        <p className="text-xs text-slate-500 mt-1">Drag and drop code files or select project directory from disk</p>
                      )}
                    </div>
                    <input 
                      type="file" 
                      id="folder-upload" 
                      className="hidden" 
                      {...({
                        webkitdirectory: "",
                        directory: "",
                        multiple: true
                      } as any)}
                      onChange={handleFolderChange}
                    />
                    <label 
                      htmlFor="folder-upload" 
                      className="inline-block bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs px-4 py-2 rounded-lg cursor-pointer border border-white/5 transition-colors"
                    >
                      Browse Folder
                    </label>
                  </div>
                )}

                {mode === 'file' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400">File Name</label>
                        <input
                          type="text"
                          required
                          value={fileName}
                          onChange={(e) => setFileName(e.target.value)}
                          className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500/40"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400">Syntax Language</label>
                        <select
                          value={fileLanguage}
                          onChange={(e) => setFileLanguage(e.target.value)}
                          className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500/40"
                        >
                          <option>Java</option>
                          <option>Python</option>
                          <option>JavaScript</option>
                          <option>TypeScript</option>
                          <option>XML</option>
                          <option>YAML</option>
                          <option>Plain Text</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">Source Code Block</label>
                      <div className="h-64 border border-white/5 rounded-xl overflow-hidden">
                        <Editor
                          height="100%"
                          theme="vs-dark"
                          language={fileLanguage.toLowerCase()}
                          value={fileContent}
                          onChange={(val) => setFileContent(val || '')}
                          options={{
                            minimap: { enabled: false },
                            fontSize: 12,
                            fontFamily: 'Fira Code'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
                >
                  <Dna className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>{loading ? 'Configuring Scan...' : 'Start CodeDNA Scanner'}</span>
                </button>
              </form>
            </GlassCard>
          </div>

          {/* Quick tips panel */}
          <div className="space-y-6">
            <GlassCard className="space-y-4">
              <h3 className="font-bold text-white text-base">Analysis Pipeline</h3>
              <div className="space-y-4 text-xs">
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-[10px]">1</div>
                  <p className="text-slate-400 leading-normal">**Workspace Validation**: Detects coding language extensions and filters system directories.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-[10px]">2</div>
                  <p className="text-slate-400 leading-normal">**SBOM Indexing**: Scans package manifests (`pom.xml`, `package.json`) compiling third-party libraries.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-[10px]">3</div>
                  <p className="text-slate-400 leading-normal">**Regex Audit Scan**: Static rules flags hardcoded secrets, system eval injections, and open XSS hooks.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-[10px]">4</div>
                  <p className="text-slate-400 leading-normal">**RAG Knowledge Base**: Computes keyword vectors indexing file paragraphs for context-matching chat sessions.</p>
                </div>
              </div>
            </GlassCard>
            
            <GlassCard className="bg-indigo-950/20 border-indigo-500/20 space-y-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 w-fit"><ShieldCheck className="w-5 h-5" /></div>
              <h4 className="font-bold text-white text-sm">Security Assured</h4>
              <p className="text-xs text-slate-400 leading-normal">All code is scanned using local pattern libraries. We never send your full repository directory directly to public LLM API networks.</p>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};
export default UploadPage;
