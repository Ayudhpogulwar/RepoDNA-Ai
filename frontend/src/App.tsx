import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AnalysisProvider, useAnalysis } from './context/AnalysisContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { Dashboard } from './pages/Dashboard';
import { UploadPage } from './pages/UploadPage';
import { ProfilePage } from './pages/ProfilePage';
import { AnalysisProgressPage } from './pages/AnalysisProgressPage';
import { RepoDashboard } from './pages/RepoDashboard';
import { CodeExplorerPage } from './pages/CodeExplorerPage';
import { VisualizationsPage } from './pages/VisualizationsPage';
import { ChatPage } from './pages/ChatPage';
import { SecurityScanPage } from './pages/SecurityScanPage';
import { SbomPage } from './pages/SbomPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';
import { PipelinePage } from './pages/PipelinePage';

// Protected Route Guard
const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#111827] text-white flex items-center justify-center font-semibold animate-pulse">Loading Session...</div>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

// Admin Route Guard
const AdminRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#111827] text-white flex items-center justify-center font-semibold animate-pulse">Loading Session...</div>;
  return user && user.role === 'ROLE_ADMIN' ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

// Layout for Project workspaces (Sidebar + content + auto project loader)
const ProjectLayout = () => {
  const { id } = useParams<{ id: string }>();
  const { selectedProject, selectProject } = useAnalysis();

  React.useEffect(() => {
    if (id) {
      const projId = Number(id);
      if (!selectedProject || selectedProject.id !== projId) {
        selectProject(projId);
      }
    }
  }, [id, selectedProject, selectProject]);

  if (!selectedProject || selectedProject.id !== Number(id)) {
    return (
      <div className="min-h-screen bg-[#111827] text-white flex items-center justify-center font-semibold animate-pulse">
        Loading Workspace...
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#111827]">
      <Sidebar />
      <main className="flex-grow p-6 lg:p-8 overflow-y-auto max-w-[calc(100vw-16rem)]">
        <Outlet />
      </main>
    </div>
  );
};

// General Header+Main Layout
const MainLayout = () => {
  return (
    <div className="min-h-screen bg-[#111827] text-slate-200">
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected Dashboard/Upload/Profile Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          
          {/* Admin Restricted Routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
          
          {/* Protected Workspace Nested Routes */}
          <Route path="/project/:id" element={<ProjectLayout />}>
            <Route index element={<RepoDashboard />} />
            <Route path="progress" element={<AnalysisProgressPage />} />
            <Route path="explorer" element={<CodeExplorerPage />} />
            <Route path="visualizations" element={<VisualizationsPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="security" element={<SecurityScanPage />} />
            <Route path="sbom" element={<SbomPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="pipeline" element={<PipelinePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AnalysisProvider>
          <MainLayout />
        </AnalysisProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
