import React, { useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Key, Cpu, HelpCircle, Save, Sliders, Lock, Mail, Palette } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { user, token } = useAuth();
  const isAdmin = user?.role === 'ROLE_ADMIN';



  // User Preferences states
  const [themeAccent, setThemeAccent] = useState(localStorage.getItem('theme_accent') || 'indigo');
  const [defaultLanding, setDefaultLanding] = useState(localStorage.getItem('default_landing') || 'dashboard');
  const [devLevel, setDevLevel] = useState(localStorage.getItem('dev_level') || 'mid');
  const [alertSecurity, setAlertSecurity] = useState(localStorage.getItem('alert_security') !== 'false');
  const [alertDependencies, setAlertDependencies] = useState(localStorage.getItem('alert_dependencies') === 'true');
  const [prefSaveStatus, setPrefSaveStatus] = useState('');

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // API Key integration states
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [depth, setDepth] = useState('standard');
  const [saveStatus, setSaveStatus] = useState('');

  React.useEffect(() => {
    const fetchApiSettings = async () => {
      if (!isAdmin) return;
      try {
        const res = await fetch('http://localhost:8080/api/admin/settings', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (res.ok) {
          const data = await res.json();
          setGeminiKey(data.gemini_key || '');
          setOpenaiKey(data.openai_key || '');
        }
      } catch (err) {
        console.error('Failed to load system settings from backend.');
      }
    };
    fetchApiSettings();
  }, [isAdmin, token]);

  const handleSaveAPIKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      const res = await fetch('http://localhost:8080/api/admin/settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gemini_key: geminiKey,
          openai_key: openaiKey,
        }),
      });
      if (res.ok) {
        setSaveStatus('API settings saved successfully on the server!');
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus('Error: Failed to save settings.');
      }
    } catch (err) {
      setSaveStatus('Network error saving settings.');
    }
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('theme_accent', themeAccent);
    localStorage.setItem('default_landing', defaultLanding);
    localStorage.setItem('dev_level', devLevel);
    localStorage.setItem('alert_security', String(alertSecurity));
    localStorage.setItem('alert_dependencies', String(alertDependencies));
    setPrefSaveStatus('Preferences saved successfully!');
    setTimeout(() => setPrefSaveStatus(''), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordStatus('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match!');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch('http://localhost:8080/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.ok) {
        setPasswordStatus('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const bodyText = await res.text();
        setPasswordError(bodyText || 'Failed to update password. Please check your current password.');
      }
    } catch (err) {
      setPasswordError('Network connection failure. Try again.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Platform Settings</h1>
        <p className="text-sm text-slate-400">Configure LLM integrations, visual preferences, and account security</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: API Configurations & User Preferences */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Card 1: API Integrations (Admin Only) */}
          {isAdmin && (
            <GlassCard className="p-8 space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-400" />
                <span>API Integrations (System-Wide Keys)</span>
              </h2>
              
              {saveStatus && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl">
                  {saveStatus}
                </div>
              )}

              <form onSubmit={handleSaveAPIKeys} className="space-y-6">
                
                {/* Gemini Key Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Gemini API Key</span>
                    </label>
                    <span className="text-[10px] text-indigo-400 font-semibold px-2 py-0.5 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                      Recommended
                    </span>
                  </div>
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
                  />
                </div>

                {/* OpenAI Key Input */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-indigo-400" />
                    <span>OpenAI API Key (Alternative)</span>
                  </label>
                  <input
                    type="password"
                    placeholder="sk-proj-..."
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
                  />
                </div>

                {/* Scanner settings */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Static Scan Depth</span>
                  </label>
                  <select
                    value={depth}
                    onChange={(e) => setDepth(e.target.value)}
                    className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
                  >
                    <option value="light">Light (Fast regex matching only)</option>
                    <option value="standard">Standard (Regex + basic syntax class mappings)</option>
                    <option value="deep">Deep (Full heuristics index + embedding RAG queries)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Configuration</span>
                </button>

              </form>
            </GlassCard>
          )}

          {/* Card 2: User Preferences (Everyone) */}
          <GlassCard className="p-8 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-400" />
              <span>User Preferences</span>
            </h2>

            {prefSaveStatus && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl">
                {prefSaveStatus}
              </div>
            )}

            <form onSubmit={handleSavePreferences} className="space-y-6">
              
              {/* Color Accent */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Interface Theme Accent</span>
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {['indigo', 'purple', 'emerald', 'amber'].map((accent) => (
                    <button
                      key={accent}
                      type="button"
                      onClick={() => setThemeAccent(accent)}
                      className={`px-3 py-2 text-xs font-bold rounded-xl border capitalize transition-all ${
                        themeAccent === accent
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/15'
                          : 'bg-slate-950/60 border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {accent}
                    </button>
                  ))}
                </div>
              </div>

              {/* Default Landing Tab */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Default Workspace Landing Page</span>
                </label>
                <select
                  value={defaultLanding}
                  onChange={(e) => setDefaultLanding(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
                >
                  <option value="dashboard">Project Overview Dashboard</option>
                  <option value="explorer">Code Explorer Explorer</option>
                  <option value="security">Security Scan Vulnerabilities</option>
                  <option value="sbom">SBOM Dependencies list</option>
                </select>
              </div>

              {/* Developer Experience Level */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Developer Experience Level</span>
                </label>
                <select
                  value={devLevel}
                  onChange={(e) => setDevLevel(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
                >
                  <option value="junior">Junior Developer (Detailed setup & step-by-step guides)</option>
                  <option value="mid">Mid-Level Developer (Standard checklists & system maps)</option>
                  <option value="senior">Senior Developer (High-level design & API boundaries)</option>
                </select>
              </div>

              {/* Email alerts */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Email Alerts & Notifications</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer group text-slate-300">
                  <input
                    type="checkbox"
                    checked={alertSecurity}
                    onChange={(e) => setAlertSecurity(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-white/10 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="text-xs group-hover:text-white transition-colors">
                    Send email notifications when High severity vulnerabilities are detected in a repository.
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group text-slate-300">
                  <input
                    type="checkbox"
                    checked={alertDependencies}
                    onChange={(e) => setAlertDependencies(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-white/10 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="text-xs group-hover:text-white transition-colors">
                    Send weekly alerts summarizing outdated or insecure packages in the SBOM database.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3.5 rounded-xl transition-all border border-white/5 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Preferences</span>
              </button>

            </form>
          </GlassCard>

        </div>

        {/* Right Column: Account Security & Explanations */}
        <div className="space-y-8">
          
          {/* Change Password Form (Everyone) */}
          <GlassCard className="p-8 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-400" />
              <span>Change Password</span>
            </h2>

            {passwordStatus && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl">
                {passwordStatus}
              </div>
            )}

            {passwordError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
                {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-semibold">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-semibold">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-semibold">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/40 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{savingPassword ? 'Updating...' : 'Change Password'}</span>
              </button>
            </form>
          </GlassCard>

          {/* Explain panel */}
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4">
              <HelpCircle className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">How API Keys work</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              CodeDNA uses API Keys to run structural code indexing, summaries, and developer onboarding roadmap calculations.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              If no keys are provided, the platform automatically enters a **heuristic simulation mode** using offline parsing rules, allowing you to test layouts without incurring token fees.
            </p>
          </GlassCard>
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;
