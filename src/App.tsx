import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppErrorBoundary from './components/AppErrorBoundary';
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
      <AppErrorBoundary>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/plugins" element={<Plugins />} />
            <Route path="/agent" element={<DeferredFeature name="AI Agent" flag="feature_flags.agent" />} />
            <Route path="/workflows" element={<DeferredFeature name="Workflow" flag="feature_flags.workflow" />} />
            <Route path="/edge" element={<DeferredFeature name="Edge" flag="feature_flags.edge" />} />
            <Route path="/rbac" element={<RBAC />} />
            <Route path="/system" element={<SystemHealth />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </Layout>
      </AppErrorBoundary>
    </Router>
  );
}
