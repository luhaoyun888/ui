import { useState, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Settings, 
  ShieldCheck, 
  Activity, 
  Puzzle, 
  LogOut, 
  Lock,
  Menu,
  X,
  Plus,
  Cpu,
  Workflow,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: '核心总览', path: '/' },
  { icon: Puzzle, label: '插件管理', path: '/plugins' },
  { icon: Lock, label: 'RBAC 权限', path: '/rbac' },
  { icon: Activity, label: '系统健康', path: '/system' },
  { icon: Zap, label: 'AI Agent', path: '/agent' },
  { icon: Workflow, label: '工作流', path: '/workflows' },
  { icon: Cpu, label: '边缘计算', path: '/edge' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0f172a] text-slate-200 font-sans">
      {/* Mesh Gradients */}
      <div className="mesh-gradient-1"></div>
      <div className="mesh-gradient-2"></div>
      <div className="mesh-gradient-3"></div>

      <div className="relative z-10 flex min-h-screen p-4 gap-4 w-full">
        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: sidebarOpen ? 260 : 80 }}
          className="fixed left-4 top-4 bottom-4 glass-card rounded-[2rem] z-50 flex flex-col p-6 shadow-2xl overflow-hidden"
        >
          <div className="flex items-center gap-3 mb-10 overflow-hidden">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-pink-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-bold text-white tracking-tight text-xl whitespace-nowrap"
              >
                UI-Main Pro
              </motion.span>
            )}
          </div>

          <nav className="flex-1 space-y-2">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group relative",
                    isActive ? "glass-panel text-white border border-white/20" : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300")} />
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="font-medium text-sm whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                  {!sidebarOpen && isActive && (
                    <div className="absolute left-0 w-1.5 h-6 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto">
            <div className={cn("p-4 bg-indigo-500/10 border border-indigo-400/20 rounded-[1.5rem] relative overflow-hidden mb-4 transition-all", !sidebarOpen && "p-2")}>
              {sidebarOpen && (
                <>
                  <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mb-1">FOUNDATION CONSOLE</p>
                  <p className="text-xs text-white font-bold">最小可运行核心</p>
                </>
              )}
              {!sidebarOpen && <div className="w-2 h-2 bg-indigo-500 rounded-full mx-auto" />}
            </div>
            <button className="flex items-center gap-4 px-4 py-3 w-full rounded-2xl hover:bg-white/5 text-slate-400 hover:text-rose-400 transition-colors">
              <LogOut className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span className="font-medium text-sm">Sign Out</span>}
            </button>
          </div>
        </motion.aside>

        {/* Main Content */}
        <div 
          className={cn(
            "flex-1 flex flex-col gap-6 py-4 pr-4 transition-all duration-500",
            sidebarOpen ? "ml-[276px]" : "ml-[96px]"
          )}
        >
          {/* Top Header */}
          <header className="h-20 glass-panel rounded-[2.5rem] px-8 flex items-center justify-between shadow-xl w-full">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 transition-colors border border-white/5"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="hidden md:flex items-center gap-3 text-sm">
                <span className="text-slate-500 font-medium">Console</span>
                <span className="text-slate-600">/</span>
                <span className="text-white font-bold tracking-tight">
                  {NAV_ITEMS.find(i => i.path === location.pathname)?.label || 'Dashboard'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="w-10 h-10 rounded-2xl border border-indigo-500/30 p-0.5 group hover:border-indigo-500 transition-all cursor-pointer">
                <div className="w-full h-full bg-slate-800 rounded-[14px] overflow-hidden">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 overflow-y-auto w-full animate-in fade-in duration-700">
            {children}
          </div>

          {/* Footer */}
          <footer className="py-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">
            <div>© 2026 Core_PRO // SYSTEM_STATUS: <span className="text-teal-400">OPTIMAL</span></div>
            <div className="flex gap-8">
              <span className="hover:text-indigo-400 transition-colors cursor-pointer">Documentation</span>
              <span className="hover:text-pink-400 transition-colors cursor-pointer">RBAC Status</span>
              <span className="hover:text-teal-400 transition-colors cursor-pointer">API Health</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
