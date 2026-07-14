import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Dna, Lock, Mail, User as UserIcon, AlertCircle } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await register(username, email, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Registration failed. Username or email may already be taken.');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#0B0F19] px-6">
      {/* Background neons */}
      <div className="glow-primary top-[20%] right-[25%]" />
      <div className="glow-secondary bottom-[20%] left-[25%]" />

      <GlassCard className="w-full max-w-md p-8 relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <Dna className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white">Create Your Account</h2>
          <p className="text-xs text-slate-500">Unlock automatic repository scanning and node diagrams</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/25 text-red-400 text-xs rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Username</label>
            <div className="flex items-center gap-2 bg-slate-950/60 border border-white/5 rounded-xl px-3.5 py-3 text-slate-300">
              <UserIcon className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                placeholder="developer"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-transparent text-sm w-full outline-none placeholder-slate-600"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Email Address</label>
            <div className="flex items-center gap-2 bg-slate-950/60 border border-white/5 rounded-xl px-3.5 py-3 text-slate-300">
              <Mail className="w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="dev@codedna.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent text-sm w-full outline-none placeholder-slate-600"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Password</label>
            <div className="flex items-center gap-2 bg-slate-950/60 border border-white/5 rounded-xl px-3.5 py-3 text-slate-300">
              <Lock className="w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent text-sm w-full outline-none placeholder-slate-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-indigo-600/10 disabled:opacity-50 mt-2"
          >
            {loading ? 'Registering...' : 'Sign Up'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
            Sign In Instead
          </Link>
        </div>
      </GlassCard>
    </div>
  );
};
export default RegisterPage;
