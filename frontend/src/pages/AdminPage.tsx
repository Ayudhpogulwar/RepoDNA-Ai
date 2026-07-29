import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/GlassCard';
import { ShieldCheck, User as UserIcon, RefreshCw, AlertTriangle, ToggleLeft, ToggleRight, CheckCircle2 } from 'lucide-react';

interface UserData {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

export const AdminPage: React.FC = () => {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api';
      const res = await fetch(`${API_BASE}/auth/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        setError('Failed to load users. Access Denied.');
      }
    } catch (err) {
      setError('Error connecting to backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  const handleToggleRole = async (userId: number, currentRole: string) => {
    const newRole = currentRole === 'ROLE_ADMIN' ? 'ROLE_USER' : 'ROLE_ADMIN';
    setError('');
    setActionSuccess('');
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api';
      const res = await fetch(`${API_BASE}/auth/users/${userId}/role?role=${newRole}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        setActionSuccess(`User role updated to ${newRole === 'ROLE_ADMIN' ? 'Admin' : 'User'} successfully!`);
        fetchUsers();
        setTimeout(() => setActionSuccess(''), 4000);
      } else {
        setError('Failed to update user role.');
      }
    } catch (err) {
      setError('Network error updating user role.');
    }
  };

  if (currentUser?.role !== 'ROLE_ADMIN') {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-6">
        <GlassCard className="max-w-md w-full p-8 text-center space-y-6">
          <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto animate-bounce" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Access Denied</h1>
            <p className="text-sm text-slate-400">
              You do not have administrative privileges to view the Admin Control Panel. Please log out and sign in with an administrator account.
            </p>
          </div>
        </GlassCard>
      </div>
    );
  }

  const adminCount = users.filter(u => u.role === 'ROLE_ADMIN').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-amber-500" />
            <span>Admin Control Panel</span>
          </h1>
          <p className="text-sm text-slate-400">Manage registered user accounts, roles, and system integration privileges</p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-all border border-white/5 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs text-slate-500 font-bold uppercase">Total Registered Users</div>
            <div className="text-3xl font-extrabold text-indigo-400">{users.length}</div>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
            <UserIcon className="w-6 h-6" />
          </div>
        </GlassCard>

        <GlassCard className="p-6 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs text-slate-500 font-bold uppercase">Administrator Accounts</div>
            <div className="text-3xl font-extrabold text-amber-400">{adminCount}</div>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </GlassCard>

        <GlassCard className="p-6 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs text-slate-500 font-bold uppercase">Core System Status</div>
            <div className="text-base font-bold text-emerald-400 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>Fully Operational</span>
            </div>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </GlassCard>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Users table */}
      <GlassCard className="p-6 overflow-hidden">
        <h2 className="text-lg font-bold text-white border-b border-white/5 pb-4 mb-6">User Database Directories</h2>
        
        {loading ? (
          <div className="py-12 text-center text-slate-400 animate-pulse font-semibold">
            Loading database records...
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            No registered users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">User ID</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Role Privileges</th>
                  <th className="py-3 px-4">Registered At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                {users.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4 font-mono text-xs text-indigo-400">#{item.id}</td>
                    <td className="py-4 px-4 font-semibold text-white">{item.username}</td>
                    <td className="py-4 px-4">{item.email}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                        item.role === 'ROLE_ADMIN' 
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/25' 
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25'
                      }`}>
                        {item.role === 'ROLE_ADMIN' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-500">
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {item.id === currentUser?.id ? (
                        <span className="text-xs text-slate-500 italic pr-2">Self</span>
                      ) : (
                        <button
                          onClick={() => handleToggleRole(item.id, item.role)}
                          className={`flex items-center gap-1.5 ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            item.role === 'ROLE_ADMIN'
                              ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                          }`}
                        >
                          {item.role === 'ROLE_ADMIN' ? (
                            <>
                              <ToggleRight className="w-4 h-4" />
                              <span>Demote to User</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-4 h-4" />
                              <span>Promote to Admin</span>
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default AdminPage;
