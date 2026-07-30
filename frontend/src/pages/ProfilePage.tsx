import React from 'react';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/GlassCard';
import { User, Mail, Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">User Profile</h1>
        <p className="text-sm text-slate-400">Manage your credentials and login session</p>
      </div>

      {/* Main card */}
      <GlassCard className="p-8 space-y-6">
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-2xl font-bold uppercase">
            {user?.username.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user?.username}</h2>
            <span className="text-xs text-indigo-400 font-semibold px-2 py-0.5 bg-indigo-500/10 rounded-full border border-indigo-500/20">
              {user?.role || 'ROLE_USER'}
            </span>
          </div>
        </div>

        {/* Profile Info Details */}
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-4 bg-slate-950/40 rounded-xl border border-white/5">
            <span className="text-slate-500 font-semibold flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" />
              <span>Username</span>
            </span>
            <span className="text-white font-medium">{user?.username}</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-950/40 rounded-xl border border-white/5">
            <span className="text-slate-500 font-semibold flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-400" />
              <span>Email Address</span>
            </span>
            <span className="text-white font-medium">{user?.email}</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-950/40 rounded-xl border border-white/5">
            <span className="text-slate-500 font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span>Role Permissions</span>
            </span>
            <span className="text-white font-medium uppercase">{user?.role}</span>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-500/10 hover:bg-red-600 border border-red-500/20 text-red-400 hover:text-white font-semibold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out from Session</span>
        </button>
      </GlassCard>
    </div>
  );
};
export default ProfilePage;
