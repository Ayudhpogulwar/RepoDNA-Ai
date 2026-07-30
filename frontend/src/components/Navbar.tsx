import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Dna, LogOut, User as UserIcon, LayoutGrid, ShieldCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <header className="glass-nav sticky top-0 w-full h-16 px-6 flex items-center justify-between z-50">
      {/* Brand Logo */}
      <Link to="/" className="flex items-center gap-2 group">
        <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl text-white shadow-md shadow-indigo-500/10 group-hover:scale-105 transition-transform">
          <Dna className="w-6 h-6 animate-pulse" />
        </div>
        <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
          RepoDNA-<span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text font-medium text-base">Ai</span>
        </span>
      </Link>

      {/* Auth Actions & Navigation */}
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link 
              to="/dashboard" 
              className="flex items-center gap-2 text-sm text-slate-300 hover:text-white px-3 py-1.5 hover:bg-slate-800/40 rounded-xl border border-white/5 transition-colors"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>

            {user.role === 'ROLE_ADMIN' && (
              <Link 
                to="/admin" 
                className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 px-3 py-1.5 hover:bg-slate-800/40 rounded-xl border border-amber-500/20 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>Admin Panel</span>
              </Link>
            )}

            {/* User Profile Hook */}
            <div className="flex items-center gap-3 border-l border-white/10 pl-4">
              <div className="flex flex-col text-right hidden sm:flex">
                <span className="text-sm font-semibold text-white">{user.username}</span>
                <span className="text-[10px] text-slate-400">
                  {user.role === 'ROLE_ADMIN' ? 'Administrator' : 'Developer'}
                </span>
              </div>
              <button 
                onClick={() => navigate('/profile')}
                className="p-2.5 bg-slate-800/60 hover:bg-indigo-600 rounded-xl text-slate-300 hover:text-white transition-all border border-white/5"
                title="Profile Settings"
              >
                <UserIcon className="w-4 h-4" />
              </button>
              <button 
                onClick={handleLogout}
                className="p-2.5 bg-slate-800/60 hover:bg-red-600 rounded-xl text-slate-300 hover:text-white transition-all border border-white/5"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Link 
              to="/login" 
              className="text-sm text-slate-300 hover:text-white px-4 py-2 transition-colors font-medium"
            >
              Sign In
            </Link>
            <Link 
              to="/register" 
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
export default Navbar;
