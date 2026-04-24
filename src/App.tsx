import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Plugins from './pages/PluginsCore';
import Login from './pages/Login';
import SystemHealth from './pages/SystemHealthCore';
import RBAC from './pages/RBACCore';
import DeferredFeature from './pages/DeferredFeature';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Login is outside the Layout */}
        <Route path="/login" element={<Login />} />
        
        {/* All other routes are wrapped in Layout */}
        <Route element={<LayoutWrapper />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/plugins" element={<Plugins />} />
          <Route path="/rbac" element={<RBAC />} />
          <Route path="/system" element={<SystemHealth />} />
          <Route path="/agent" element={<DeferredFeature name="AI Agent" flag="feature_flags.agent" />} />
          <Route path="/workflows" element={<DeferredFeature name="Workflow" flag="feature_flags.workflow" />} />
          <Route path="/edge" element={<DeferredFeature name="Edge" flag="feature_flags.edge" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

function LayoutWrapper() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
