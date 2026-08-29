import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Dna, LogOut, User as UserIcon, LayoutGrid, ShieldCheck, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/', { replace: true });
  };

  return (
    <header className="glass-nav sticky top-0 w-full h-16 px-4 md:px-6 flex items-center justify-between z-50">
      {/* Brand Logo */}
      <Link to="/" className="flex items-center gap-2 group" onClick={() => setMobileMenuOpen(false)}>
        <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl text-white shadow-md shadow-indigo-500/10 group-hover:scale-105 transition-transform">
          <Dna className="w-5 h-5 md:w-6 md:h-6 animate-pulse" />
        </div>
        <span className="font-extrabold text-lg md:text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
          RepoDNA-<span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text font-medium text-sm md:text-base">Ai</span>
        </span>
      </Link>

      {/* Desktop Auth Actions & Navigation */}
      <div className="hidden md:flex items-center gap-4">
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

      {/* Mobile Hamburger Trigger */}
      <div className="flex md:hidden items-center gap-2">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-300 hover:text-white bg-slate-800/60 rounded-xl border border-white/10"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-[#0F172A]/95 border-b border-white/10 backdrop-blur-xl p-4 space-y-3 flex flex-col md:hidden z-50 shadow-2xl animate-fade-in-down">
          {user ? (
            <>
              <div className="flex items-center justify-between px-3 py-2 bg-slate-900/60 rounded-xl border border-white/5">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">{user.username}</span>
                  <span className="text-[10px] text-slate-400">
                    {user.role === 'ROLE_ADMIN' ? 'Administrator' : 'Developer'}
                  </span>
                </div>
                <button 
                  onClick={() => { setMobileMenuOpen(false); navigate('/profile'); }}
                  className="p-2 bg-slate-800 hover:bg-indigo-600 rounded-lg text-slate-300 hover:text-white transition-all"
                >
                  <UserIcon className="w-4 h-4" />
                </button>
              </div>

              <Link 
                to="/dashboard" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 text-sm text-slate-200 hover:bg-indigo-600/20 px-3 py-2.5 rounded-xl border border-white/5"
              >
                <LayoutGrid className="w-4 h-4 text-indigo-400" />
                <span>Dashboard</span>
              </Link>

              {user.role === 'ROLE_ADMIN' && (
                <Link 
                  to="/admin" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 text-sm text-amber-400 hover:bg-amber-500/10 px-3 py-2.5 rounded-xl border border-amber-500/20"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <span>Admin Panel</span>
                </Link>
              )}

              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600/20 text-red-300 hover:bg-red-600 hover:text-white rounded-xl text-sm font-medium border border-red-500/20 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-1">
              <Link 
                to="/login" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center text-sm text-slate-200 bg-slate-800/80 hover:bg-slate-700 py-2.5 rounded-xl font-medium border border-white/10"
              >
                Sign In
              </Link>
              <Link 
                to="/register" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/20"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
export default Navbar;
