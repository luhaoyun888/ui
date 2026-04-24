import React, { useState, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Puzzle, 
  Terminal, 
  RefreshCw, 
  History, 
  Play, 
  StopCircle,
  Package,
  FileCode,
  CheckCircle2,
  ShieldCheck,
  Search,
  Settings,
  AlertTriangle,
  Lock,
  Eye,
  Activity,
  ChevronRight,
  Save,
  Trash2,
  ListFilter,
  ArrowRightLeft,
  Fingerprint,
  AlertCircle,
  CheckCircle,
  XCircle,
  HelpCircle,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Workflow,
  Copy,
  Code2,
  ChevronDown,
  Info
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getPermissionReferenceScenario, scenarios, blockingReasons, actionCategories } from '../mocks/permissionReferenceData';
import type { PermissionRow } from '../services/api';

type TabType = 'status' | 'invoke' | 'rbac' | 'audit' | 'governance';

export default function PluginsCore() {
  const [activeTab, setActiveTab] = useState<TabType>('status');
  const [selectedPlugin, setSelectedPlugin] = useState('Core_Logic_Handler');

  const tabs = [
    { id: 'status', label: '状态与版本', icon: RefreshCw },
    { id: 'invoke', label: '插件调用', icon: Terminal },
    { id: 'rbac', label: '权限隔离', icon: ShieldCheck },
    { id: 'audit', label: '审计审计', icon: Eye },
    { id: 'governance', label: '治理管理', icon: Settings },
  ] as const;

  const plugins = [
    { id: 'Core_Logic_Handler', name: 'Core Logic Handler', status: 'Running', version: 'v1.0.4' },
    { id: 'Data_Parsing_Engine', name: 'Data Parsing Engine', status: 'Stopped', version: 'v2.1.0' },
    { id: 'Auth_Validator', name: 'Auth Validator', status: 'Running', version: 'v0.9.8' },
    { id: 'File_Optimizer', name: 'File Optimizer', status: 'Draft', version: 'v0.1.0' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Section */}
      <section className="glass-card rounded-[2.5rem] p-8 border-white/10 relative overflow-hidden">
        <div className="mesh-gradient-1 opacity-20" />
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-black tracking-[0.2em] uppercase">Core Subsystem</span>
              <div className="h-1 w-1 rounded-full bg-slate-700" />
              <span className="text-slate-500 text-[10px] font-bold tracking-widest uppercase">Lifecycle v2.1</span>
            </div>
            <div className="flex items-baseline gap-3">
              <h1 className="text-4xl font-black text-white tracking-tighter">插件中枢</h1>
              <span className="text-slate-500 text-xl font-medium font-mono">PLUGINS_CENTER</span>
            </div>
            <p className="text-slate-400 mt-3 max-w-2xl text-sm leading-relaxed">
              统一管理插件集群的生命周期、调用链路、安全策略与资源审计。
              <span className="text-indigo-400/80 ml-2 font-medium">支持本地草稿同步与生产环境热重载。</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-6 py-3 glass-panel rounded-2xl text-slate-300 hover:text-white transition-all flex items-center gap-2 border border-white/5 hover:border-white/20">
              <History className="w-4 h-4" /> 变更历史
            </button>
            <button className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-2xl shadow-indigo-500/20 hover:bg-indigo-500 active:scale-95 transition-all flex items-center gap-2">
              <Package className="w-5 h-5" /> 部署新插件
            </button>
          </div>
        </div>
      </section>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar: Plugin List */}
        <aside className="lg:w-80 shrink-0 space-y-4">
          <div className="glass-card rounded-3xl p-6 h-fit sticky top-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">插件集群</h2>
              <button className="p-2 hover:bg-white/5 rounded-lg text-slate-500 transition-colors">
                <Search className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {plugins.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlugin(p.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl transition-all border group relative overflow-hidden",
                    selectedPlugin === p.id 
                      ? "bg-indigo-600/10 border-indigo-500/50 shadow-lg shadow-indigo-500/5" 
                      : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
                  )}
                >
                  {selectedPlugin === p.id && (
                    <motion.div 
                      layoutId="active-plugin-glow"
                      className="absolute inset-0 bg-indigo-500/5 blur-xl pointer-events-none"
                    />
                  )}
                  <div className="flex justify-between items-start mb-1 relative z-10">
                    <span className={cn(
                      "font-bold text-sm transition-colors",
                      selectedPlugin === p.id ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                    )}>
                      {p.name}
                    </span>
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full mt-1.5",
                      p.status === 'Running' ? "bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)]" :
                      p.status === 'Stopped' ? "bg-slate-500" : "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                    )} />
                  </div>
                  <div className="flex items-center justify-between relative z-10">
                    <code className="text-[10px] font-mono text-slate-600 uppercase tracking-tighter">{p.version}</code>
                    <span className="text-[9px] font-black text-slate-700 uppercase tracking-[0.1em]">{p.status}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 space-y-6">
          {/* Tab Navigation */}
          <div className="glass-card rounded-[2rem] p-2 flex gap-1 items-center overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap relative group",
                  activeTab === tab.id 
                    ? "text-white" 
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="active-tab-bg"
                    className="absolute inset-0 bg-white/5 rounded-2xl"
                  />
                )}
                <tab.icon className={cn(
                  "w-4 h-4 transition-transform group-hover:scale-110",
                  activeTab === tab.id ? "text-indigo-400" : "text-slate-600"
                )} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="min-h-[600px]"
            >
              {activeTab === 'status' && <StatusView pluginId={selectedPlugin} />}
              {activeTab === 'invoke' && <InvokeView pluginId={selectedPlugin} />}
              {activeTab === 'rbac' && <RBACView pluginId={selectedPlugin} />}
              {activeTab === 'audit' && <AuditView pluginId={selectedPlugin} />}
              {activeTab === 'governance' && <GovernanceView pluginId={selectedPlugin} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// --- Tab: StatusView ---
function StatusView({ pluginId }: { pluginId: string }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 glass-card rounded-[2.5rem] p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full" />
          <h2 className="text-xl font-black text-white flex items-center gap-3 mb-8 relative z-10">
            <RefreshCw className="w-5 h-5 text-indigo-400" />
            版本与生命周期
          </h2>

          <div className="space-y-10 relative z-10">
            {/* Version Stages */}
            <div className="relative">
              <div className="absolute left-[27px] top-10 bottom-0 w-[2px] bg-slate-800" />
              <div className="space-y-12">
                <div className="flex gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 relative z-10">
                    <Save className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-white font-bold tracking-tight">本地开发草稿</h4>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Last Saved: 4m ago</span>
                    </div>
                    <p className="text-slate-400 text-sm mb-4">存在本地存储中，尚未同步到系统核心库。</p>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-xl text-xs font-bold hover:bg-indigo-500/20 transition-all border border-indigo-500/20">保存当前草稿</button>
                      <button className="px-4 py-2 bg-slate-800 text-slate-400 rounded-xl text-xs font-bold hover:text-white transition-all">丢弃变更</button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center shrink-0 relative z-10">
                    <Play className="w-6 h-6 text-teal-400" />
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="text-white font-bold tracking-tight">运行态实例 <span className="text-teal-400 ml-2">v1.0.4-stable</span></h4>
                        <span className="px-2 py-0.5 bg-teal-500/20 text-teal-400 rounded text-[9px] font-black uppercase tracking-widest">Active</span>
                    </div>
                    <p className="text-slate-400 text-sm mb-4">当前正在生产环境执行请求的实时版本。</p>
                    <div className="flex items-center gap-6">
                       <button className="flex items-center gap-2 text-rose-400 text-xs font-bold hover:underline">
                         <StopCircle className="w-4 h-4" /> 退出运行态
                       </button>
                       <button className="flex items-center gap-2 text-indigo-400 text-xs font-bold hover:underline">
                         <RefreshCw className="w-4 h-4" /> 强制同步状态
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-8 border-white/5">
            <h3 className="text-white font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Runtime Metrics
            </h3>
            <div className="space-y-6">
               <div className="space-y-2">
                 <div className="flex justify-between text-xs"><span className="text-slate-500">CPU Usage</span><span className="text-white font-mono">1.2%</span></div>
                 <div className="h-1 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-[12%]" /></div>
               </div>
               <div className="space-y-2">
                 <div className="flex justify-between text-xs"><span className="text-slate-500">Memory</span><span className="text-white font-mono">24.5 MB</span></div>
                 <div className="h-1 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 w-[45%]" /></div>
               </div>
               <div className="space-y-2">
                 <div className="flex justify-between text-xs"><span className="text-slate-500">Live Connections</span><span className="text-white font-mono">1,280</span></div>
                 <div className="h-1 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-teal-500 w-[82%]" /></div>
               </div>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-8 border-white/5 relative group cursor-pointer overflow-hidden">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
            <h3 className="text-white font-bold text-sm mb-4 relative z-10">快速部署向导</h3>
            <p className="text-slate-500 text-xs leading-relaxed relative z-10">准备将 <b>Local Draft</b> 推送到 <b>Staging</b> 环境进行集成测试？</p>
            <button className="mt-6 w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all relative z-10">
              开始灰度部署
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Tab: InvokeView ---
function InvokeView({ pluginId }: { pluginId: string }) {
  return (
    <div className="glass-card rounded-[2.5rem] p-8 lg:p-12 min-h-[600px] flex flex-col">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
             <Terminal className="w-6 h-6 text-indigo-400" />
             函数调用控制台
          </h2>
          <p className="text-slate-500 text-sm mt-1 uppercase font-bold tracking-[0.1em]">Target: {pluginId}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-3 glass-panel rounded-xl text-slate-400 hover:text-white transition-all"><Settings className="w-5 h-5"/></button>
          <button className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all border border-white/10 uppercase tracking-widest">
            Reset State
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 flex-1">
        <div className="space-y-6">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Operation Handler</label>
            <div className="relative group">
              <select className="w-full bg-[#0f172a] border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-indigo-500/50 appearance-none transition-all cursor-pointer">
                <option>process_metadata_stream</option>
                <option>validate_security_envelope</option>
                <option>dispatch_event_hook</option>
              </select>
              <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 rotate-90 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-4 flex-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Request Body (JSON)</label>
            <div className="relative h-64">
              <textarea 
                className="w-full h-full bg-[#020617]/50 border border-white/5 rounded-2xl p-6 font-mono text-sm text-indigo-300 outline-none focus:border-indigo-500/30 transition-all resize-none"
                defaultValue={`{\n  "payload_id": "8x-3392",\n  "async": true,\n  "context": {\n    "source": "api_gateway",\n    "priority": "high"\n  }\n}`}
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <button className="px-3 py-1 bg-white/5 rounded-lg text-[10px] text-slate-500 hover:text-white transition-colors">Format</button>
                <button className="px-3 py-1 bg-white/5 rounded-lg text-[10px] text-slate-500 hover:text-white transition-colors">Copy</button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col">
           <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 mb-4">Invocation Output</label>
           <div className="flex-1 glass-surface rounded-3xl p-8 font-mono text-xs overflow-hidden relative border-white/10">
              <div className="space-y-3 opacity-80 h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                <p className="flex gap-3"><span className="text-slate-700">10:42:01.2</span> <span className="text-indigo-400">[SYSTEM]</span> <span className="text-slate-400">Initializing sandbox for request ID: REQ_9921...</span></p>
                <p className="flex gap-3"><span className="text-slate-700">10:42:01.3</span> <span className="text-teal-400">[RESOLVE]</span> <span className="text-slate-400">Function found in runtime symbols.</span></p>
                <p className="flex gap-3"><span className="text-slate-700">10:42:01.5</span> <span className="text-emerald-400">[EXECUTE]</span> <span className="text-white">Calling process_metadata_stream...</span></p>
                <p className="flex gap-3"><span className="text-slate-700">10:42:01.8</span> <span className="text-slate-600">[METRIC]</span> <span className="text-slate-500">Heap change: +0.4MB | Duration: 292ms</span></p>
                <p className="flex gap-3"><span className="text-slate-700">10:42:01.8</span> <span className="text-emerald-400">[RESULT]</span> <span className="text-emerald-300">{'{ "status": "processed", "hash": "sha256-..." }'}</span></p>
                <p className="flex gap-3"><span className="text-slate-700">10:42:01.9</span> <span className="animate-pulse text-indigo-500">_</span></p>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent pointer-events-none" />
              
              <button className="absolute bottom-8 inset-x-8 py-4 bg-indigo-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-indigo-500/40 hover:bg-indigo-400 hover:-translate-y-1 transition-all active:translate-y-0">
                <Play className="w-5 h-5 fill-current" />
                Invoke Function
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

function RBACView({ pluginId: _pluginId }: { pluginId: string }) {
  const [scenarioKey, setScenarioKey] = useState('happy-mixed');
  const [selectedMainCategory, setSelectedMainCategory] = useState<'decision' | 'macro' | 'action' | 'why' | 'diag'>('decision'); 
  const [selectedPermissionKey, setSelectedPermissionKey] = useState('http_client');
  const [selectedActionKey, setSelectedActionKey] = useState('public_request');

  const [selectedVersion, setSelectedVersion] = useState('v1.0.4');
  const versions = ['v1.0.4', 'v1.0.3', 'v1.0.2-beta', 'v1.0.0'];

  const scenario = getPermissionReferenceScenario(scenarioKey);
  const { matrix } = scenario;
  const { summary, governance_bridge } = matrix;

  const allActions = matrix.rows.flatMap(r => r.governed_action_domains);
  const currentMacro = matrix.rows.find(r => r.permission_key === selectedPermissionKey) || matrix.rows[0];
  const currentAction = allActions.find(a => a.action_domain === selectedActionKey) || allActions[0];

  const handleJump = (target: 'macro' | 'action' | 'diag' | 'why', key?: string) => {
    setSelectedMainCategory(target as any);
    if (key) {
      if (target === 'macro') setSelectedPermissionKey(key);
      if (target === 'action') {
        const action = allActions.find(a => a.action_domain === key);
        if (action) {
          setSelectedPermissionKey(action.top_permission_key);
          setSelectedActionKey(key);
        }
      }
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const cards = containerRef.current.getElementsByClassName('spotlight-card');
    for (const card of cards as any) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    }
  };

  return (
    <div className="flex flex-col gap-6 min-h-[850px] w-full" ref={containerRef} onMouseMove={handleMouseMove}>
      {/* 1. Global Context & Breadcrumb */}
      <div className="flex items-center justify-between glass-card rounded-3xl p-5 border-white/5 bg-white/[0.01] w-full">
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
              <span className="hover:text-white cursor-pointer transition-colors">插件管理</span>
              <ChevronRight className="w-3 h-3 opacity-50" />
              <div className="relative group">
                <select 
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                  className="appearance-none bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-3 py-1 pr-8 rounded-xl text-[10px] font-black outline-none border border-indigo-500/20 cursor-pointer transition-all"
                >
                  {versions.map(v => <option key={v} value={v} className="bg-[#0f172a]">{v}</option>)}
                </select>
                <ChevronDown className="w-3 h-3 text-indigo-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none group-hover:translate-y-[-40%] transition-transform" />
              </div>
              <ChevronRight className="w-3 h-3 opacity-50 text-indigo-500" />
              <span className="text-white">Core Logic Handler</span>
              <ChevronRight className="w-3 h-3 opacity-50 text-indigo-500" />
              <span className="text-indigo-200">权限与隔离</span>
           </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-3 bg-slate-900/50 px-4 py-2 rounded-2xl border border-white/5">
              <ListFilter className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">场景:</span>
              <select 
                value={scenarioKey} 
                onChange={(e) => setScenarioKey(e.target.value)}
                className="bg-transparent text-indigo-400 text-[10px] font-black outline-none cursor-pointer hover:text-indigo-300 transition-colors"
              >
                {Object.values(scenarios).map(s => <option key={s.key} value={s.key} className="bg-[#0f172a]">{s.name}</option>)}
              </select>
           </div>
           <button className="px-6 py-2.5 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-2 group active:scale-95">
             <Save className="w-4 h-4 group-hover:rotate-12 transition-transform" />
             保存并测试
           </button>
        </div>
      </div>

      {/* 2. Secondary Horizontal Category Nav */}
      <div className="glass-card rounded-[2rem] p-2 flex gap-1 items-center overflow-x-auto no-scrollbar bg-white/[0.01] border-white/5">
        {[
          { id: 'decision', label: '权限决策矩阵', icon: Lock, sub: 'PERM_DEC_MATRIX' },
          { id: 'macro', label: '放行大类权限', icon: ShieldCheck, sub: 'MACRO_GRANT_LAYER' },
          { id: 'action', label: '放行具体动作', icon: Puzzle, sub: 'ACTION_DOMAIN_UNIT' },
          { id: 'why', label: '为什么还不能用', icon: HelpCircle, sub: 'BLOCK_DIAGNOSTICS' },
          { id: 'diag', label: '高级诊断', icon: Terminal, sub: 'CORE_DEBUG_PROBE' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedMainCategory(item.id as any)}
            className={cn(
              "flex flex-col gap-1 items-start px-8 py-4 rounded-[1.5rem] transition-all relative group overflow-hidden min-w-[180px]",
              selectedMainCategory === item.id 
                ? "text-white" 
                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
            )}
          >
            {selectedMainCategory === item.id && (
              <motion.div 
                layoutId="rbac-cat-bg"
                className="absolute inset-0 bg-indigo-600/10 border border-indigo-500/20 rounded-[1.5rem]"
              />
            )}
            <div className="flex items-center gap-3 relative z-10">
              <item.icon className={cn(
                "w-4 h-4 transition-transform group-hover:scale-110",
                selectedMainCategory === item.id ? "text-indigo-400" : "text-slate-600"
              )} />
              <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
            </div>
            <span className="text-[8px] font-mono opacity-50 tracking-[0.2em] relative z-10 ml-7">{item.sub}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-8">
        {/* 3. Workspace Sidebar (Sub-navigation for variable-length lists) */}
        <aside className="w-80 shrink-0">
          <AnimatePresence mode="wait">
             {(selectedMainCategory === 'macro' || selectedMainCategory === 'action') ? (
               <motion.div 
                 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                 className="flex-1 glass-card rounded-[2.5rem] p-6 border-white/5 space-y-6 overflow-y-auto max-h-[720px] custom-scrollbar sticky top-6"
               >
                 <div>
                    <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] px-2 mb-4">
                      {selectedMainCategory === 'macro' ? 'MACRO_REGISTRY' : 'ACTION_CATEGORY'}
                    </h4>
                    <div className="space-y-1">
                      {matrix.rows.map((r) => (
                        <div key={r.permission_key} className="space-y-1">
                          <button
                            onClick={() => {
                              setSelectedPermissionKey(r.permission_key);
                              if (selectedMainCategory === 'action' && r.governed_action_domains.length > 0) {
                                setSelectedActionKey(r.governed_action_domains[0].action_domain);
                              }
                            }}
                            className={cn(
                              "w-full text-left px-4 py-3 rounded-2xl transition-all border text-[11px] font-bold uppercase",
                              selectedPermissionKey === r.permission_key 
                                ? "bg-white/5 border-white/10 text-white shadow-xl" 
                                : "bg-transparent border-transparent text-slate-500 hover:text-slate-400 hover:bg-white/[0.02]"
                            )}
                          >
                            <span className={cn(
                              "w-1 h-1 rounded-full inline-block mr-3 mb-0.5",
                              r.effective ? "bg-emerald-400" : "bg-rose-400"
                            )} />
                            {r.permission_key}
                          </button>

                          {/* Nested Actions for Action View */}
                          {selectedMainCategory === 'action' && selectedPermissionKey === r.permission_key && (
                            <div className="pl-6 space-y-1 mt-1 border-l border-white/5 ml-3">
                              {r.governed_action_domains.map(a => (
                                <button
                                  key={a.action_domain}
                                  onClick={() => setSelectedActionKey(a.action_domain)}
                                  className={cn(
                                    "w-full text-left px-4 py-2 rounded-xl text-[10px] font-mono transition-all lowercase",
                                    selectedActionKey === a.action_domain 
                                      ? "text-indigo-400 font-black bg-indigo-500/5 translate-x-1" 
                                      : "text-slate-600 hover:text-slate-400"
                                  )}
                                >
                                  {a.action_domain}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                 </div>
               </motion.div>
             ) : (
               <motion.div 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                 className="flex-1 glass-card rounded-[2.5rem] p-10 border-white/5 border-dashed flex flex-col items-center justify-center text-center gap-4"
               >
                 <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-700">
                    <ListFilter className="w-6 h-6" />
                 </div>
                 <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No Selection Required</p>
               </motion.div>
             )}
          </AnimatePresence>
        </aside>

        {/* 4. Workspace Detail Panel */}
        <main className="flex-1 min-w-0 w-full">
          <AnimatePresence mode="wait">
            {selectedMainCategory === 'decision' && (
              <motion.div 
                key="decision" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-8 spotlight-card"
              >
                <div className="grid grid-cols-4 gap-6">
                  <StatCard label="已申请权限" value={summary.requested_count} icon={Puzzle} color="indigo" />
                  <StatCard label="策略已放行" value={summary.policy_allowed_count} icon={ShieldCheck} color="teal" />
                  <StatCard label="实效生效" value={summary.effective_count} icon={CheckCircle2} color="emerald" />
                  <StatCard label="决策拒绝" value={summary.denied_count} icon={XCircle} color="rose" />
                </div>

                <div className="glass-card rounded-[3rem] overflow-hidden border-white/5 shadow-2xl">
                  <div className="p-10 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-white/[0.02] to-transparent">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-500/10 rounded-2xl"><Workflow className="w-5 h-5 text-indigo-400" /></div>
                      <h3 className="text-lg font-black text-white uppercase tracking-[0.3em]">
                        Permission Decision Matrix
                      </h3>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#030712] text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                          <th className="px-10 py-6">权限项 (Registry Key)</th>
                          <th className="px-8 py-6">准入策略检测</th>
                          <th className="px-8 py-6">Runtime 沙箱压制</th>
                          <th className="px-10 py-6">最终生效状态</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 bg-transparent">
                        {matrix.rows.map((row) => (
                          <tr key={row.permission_key} className="group hover:bg-white/[0.01] transition-all">
                            <td className="px-10 py-8">
                               <div className="flex flex-col gap-1">
                                 <span className="text-[14px] font-black text-white font-mono">{row.permission_key}</span>
                                 <span className="text-[9px] text-slate-600 uppercase tracking-widest font-black">{row.module_key} MODULE</span>
                               </div>
                            </td>
                            <td className="px-8 py-8">
                               <span className={cn(
                                 "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-lg",
                                 row.policy_allowed ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                               )}>{row.policy_allowed ? 'allow' : 'deny'}</span>
                            </td>
                            <td className="px-8 py-8">
                               <div className="flex items-center gap-3">
                                 <div className={cn("w-2 h-2 rounded-full", row.forced_by_sandbox ? "bg-amber-400 animate-pulse" : "bg-slate-700")} />
                                 <span className={cn("text-[11px] font-mono font-bold", row.forced_by_sandbox ? "text-amber-400" : "text-slate-500 uppercase")}>
                                    {row.forced_by_sandbox ? 'SUPPRESSED' : 'BYPASSED'}
                                 </span>
                               </div>
                            </td>
                            <td className="px-10 py-8">
                              <div className={cn(
                                "inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl border transition-all",
                                row.effective ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                              )}>
                                {row.effective ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                <span className="text-[12px] font-bold uppercase tracking-tight">{row.effective ? 'active' : 'denied'}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {selectedMainCategory === 'macro' && (
              <motion.div 
                key="macro" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-8 spotlight-card"
              >
                <div className="glass-card rounded-[3.5rem] p-12 border-white/5 relative overflow-hidden bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent">
                  <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                     <ShieldCheck className="w-64 h-64" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-6">
                       <span>Layer 5: Macro Category Governance</span>
                       <ChevronRight className="w-4 h-4 text-slate-700" />
                       <span className="text-white bg-indigo-500/20 px-3 py-1 rounded-xl">ID: {selectedPermissionKey}</span>
                    </div>
                    <h2 className="text-5xl font-black text-white mb-12 tracking-tight group">
                      {selectedPermissionKey.replace(':', ' ').toUpperCase()}
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                      <div className="space-y-10">
                        <div>
                          <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-6">上层权限宏开关 (MACRO_SWITCH)</h4>
                          <div className="flex gap-6">
                            {[
                              { id: 'active', label: '允许放行', icon: CheckCircle2, color: 'indigo' },
                              { id: 'denied', label: '强制关闭', icon: XCircle, color: 'rose' },
                            ].map((state) => (
                                  <button 
                                key={state.id}
                                className={cn(
                                  "flex-1 group p-8 rounded-[2.5rem] border transition-all text-left relative overflow-hidden",
                                  currentMacro.grant_status === state.id 
                                    ? `bg-${state.color}-500 border-${state.color}-400 text-white shadow-2xl shadow-${state.color}-500/40` 
                                    : "bg-white/5 border-white/10 text-slate-500 hover:bg-white/10"
                                )}
                              >
                                <div className="relative z-10 flex flex-col gap-4">
                                  <state.icon className={cn("w-8 h-8", currentMacro.grant_status === state.id ? "text-white" : "text-slate-600 group-hover:text-slate-400")} />
                                  <span className="text-[13px] font-black uppercase tracking-widest">{state.label}</span>
                                </div>
                                {currentMacro.grant_status === state.id && (
                                   <div className="absolute top-0 right-0 p-4"><div className="w-2 h-2 rounded-full bg-white animate-pulse" /></div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="p-8 bg-slate-900/50 rounded-[2.5rem] border border-white/5 flex gap-6 items-start shadow-inner">
                           <AlertCircle className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
                           <div>
                              <h5 className="text-xs font-black text-white uppercase tracking-widest mb-2">治理逻辑依赖</h5>
                              <p className="text-[13px] text-slate-500 leading-relaxed font-medium">
                                这一层决定 <b>{selectedPermissionKey}</b> 协议族是否对宿主可见。如果关闭宏开关，该类目下的所有 <b>Action Domains</b> 都将失去运行时执行能力，无论其自身设置如何。
                              </p>
                           </div>
                        </div>
                      </div>

                      <div className="glass-card rounded-[2.5rem] p-10 border-white/5 space-y-8 bg-white/[0.01]">
                        <div>
                           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">包含生成的映射动作</h4>
                           <div className="flex flex-wrap gap-2">
                             {currentMacro.governed_action_domains.map(a => (
                               <div key={a.action_domain} className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[11px] font-mono text-indigo-300">
                                 {a.action_domain}
                               </div>
                             ))}
                           </div>
                        </div>
                        <div className="space-y-4 pt-6 border-t border-white/5">
                           <div className="flex justify-between items-center text-[11px] font-bold">
                              <span className="text-slate-600 uppercase tracking-widest">Metadata Source</span>
                              <span className="text-white uppercase">REGISTRY_SIGNED</span>
                           </div>
                           <div className="flex justify-between items-center text-[11px] font-bold">
                              <span className="text-slate-600 uppercase tracking-widest">Policy Consistency</span>
                              <span className="text-emerald-400 uppercase">SYNCHRONIZED</span>
                           </div>
                           <button 
                            onClick={() => handleJump('diag')}
                            className="w-full mt-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all"
                           >
                             查看底层属性探测
                           </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {selectedMainCategory === 'action' && (
              <motion.div 
                key="action" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-8 spotlight-card"
              >
                <div className="glass-card rounded-[4rem] p-16 border-white/5 relative overflow-hidden bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent">
                  <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none">
                     <Puzzle className="w-64 h-64" />
                  </div>
                  <div className="relative z-10 max-w-4xl">
                    <div className="flex items-center gap-4 text-[11px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-6">
                       <span>Layer 6: Action Domain Governance</span>
                       <ChevronRight className="w-4 h-4 text-slate-700" />
                       <span className="text-slate-500">{currentAction.top_permission_key}</span>
                       <ChevronRight className="w-4 h-4 text-slate-700" />
                       <span className="text-white bg-cyan-500/20 px-3 py-1 rounded-xl">UID: {selectedActionKey}</span>
                    </div>
                    <h2 className="text-6xl font-black text-white mb-4 tracking-tight font-mono lowercase">
                      {selectedActionKey}
                    </h2>
                    <p className="text-sm text-slate-500 font-medium mb-12 flex items-center gap-2">
                       <Fingerprint className="w-4 h-4" />
                       host_bridge.resolver.{selectedActionKey}
                    </p>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                      <div className="lg:col-span-3 space-y-12">
                        <div className="space-y-6">
                           <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Governance Mode (最小粒度治理模式)</h4>
                           <div className="flex flex-col gap-4">
                             {[
                               { id: 'default', label: '跟随默认 (Follow Default)', sub: 'Inherited from registry policy & profile settings', icon: ArrowRightLeft, color: 'indigo' },
                               { id: 'force_allow', label: '强制允许 (Force Allow)', sub: 'Bypass policy check if macro is allowed', icon: ShieldCheck, color: 'emerald' },
                               { id: 'force_deny', label: '强制关闭 (Force Close)', sub: 'Explicit blacklist entry for this specific logic', icon: ShieldAlert, color: 'rose' },
                             ].map((mode) => (
                               <button 
                                 key={mode.id}
                                 className={cn(
                                   "flex items-center gap-6 p-6 rounded-[2rem] border transition-all text-left group relative",
                                   currentAction.setting_mode === mode.id
                                     ? `bg-white/[0.03] border-${mode.color}-500/50 shadow-2xl ring-1 ring-${mode.color}-400/20`
                                     : "bg-transparent border-transparent text-slate-500 hover:bg-white/[0.02]"
                                 )}
                               >
                                  <div className={cn(
                                    "p-4 rounded-2xl transition-all",
                                    currentAction.setting_mode === mode.id ? `bg-${mode.color}-500 text-white shadow-xl` : "bg-white/5 text-slate-600"
                                  )}>
                                     <mode.icon className="w-6 h-6" />
                                  </div>
                                  <div className="flex-1">
                                     <p className={cn("text-sm font-black uppercase tracking-widest mb-1", currentAction.setting_mode === mode.id ? "text-white" : "text-slate-400 group-hover:text-slate-300")}>{mode.label}</p>
                                     <p className="text-[10px] font-medium opacity-50 tracking-wide leading-relaxed">{mode.sub}</p>
                                  </div>
                                  {currentAction.setting_mode === mode.id && (
                                     <div className={cn("absolute right-8 w-2 h-2 rounded-full", `bg-${mode.color}-400 shadow-[0_0_12px_rgba(var(--${mode.color}-400),0.8)]`)} />
                                  )}
                               </button>
                             ))}
                           </div>
                        </div>
                      </div>

                      <div className="lg:col-span-2 space-y-8">
                         <div className="glass-card rounded-[3rem] p-10 border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent">
                            <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-8">运行时状态检查 (Runtime Check)</h4>
                            <div className="flex flex-col items-center text-center gap-8 py-4">
                               <div className={cn(
                                 "w-32 h-32 rounded-full flex items-center justify-center border-4 relative",
                                 currentAction.effective_runtime_enabled ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5"
                               )}>
                                  {currentAction.effective_runtime_enabled 
                                    ? <CheckCircle2 className="w-16 h-16 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]" /> 
                                    : <XCircle className="w-16 h-16 text-rose-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.3)]" />
                                  }
                                  <div className="absolute -bottom-4 bg-[#0f172a] px-5 py-1.5 rounded-full border border-white/10">
                                     <span className={cn("text-[10px] font-black uppercase tracking-widest", currentAction.effective_runtime_enabled ? "text-emerald-400" : "text-rose-400")}>
                                       {currentAction.effective_runtime_enabled ? 'Effective Active' : 'Effective Denied'}
                                     </span>
                                  </div>
                               </div>
                               <div className="w-full space-y-4 pt-10 border-t border-white/5">
                                  <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-tighter">
                                     <span className="text-slate-600">Macro Constraint</span>
                                     <span className={currentMacro.grant_status === 'active' ? "text-emerald-400" : "text-rose-400"}>
                                       {currentMacro.grant_status === 'active' ? 'Passed' : 'Blocked (L5)'}
                                     </span>
                                  </div>
                                  <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-tighter">
                                     <span className="text-slate-600">Runtime Override</span>
                                     <span className={currentAction.has_runtime_override ? "text-amber-400" : "text-slate-400"}>
                                       {currentAction.has_runtime_override ? 'Active Override' : 'Off'}
                                     </span>
                                  </div>
                               </div>
                            </div>
                         </div>
                         <button 
                          onClick={() => handleJump('why')}
                          className="w-full flex items-center justify-center gap-3 py-6 bg-rose-500/10 border border-rose-500/20 rounded-[2.5rem] text-[11px] font-black text-rose-400 uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-xl shadow-rose-500/10"
                         >
                           <HelpCircle className="w-4 h-4" />
                           如果仍无法使用？点击诊断
                         </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {selectedMainCategory === 'why' && (
              <motion.div 
                key="why" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <div className="glass-card rounded-[4rem] p-16 border-white/5 relative bg-gradient-to-br from-indigo-500/5 to-transparent">
                  <div className="flex items-center gap-4 text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-8">
                     <span>Diagnosis System: Layer 7 Diagnostics</span>
                  </div>
                  <h2 className="text-6xl font-black text-white mb-6 tracking-tighter">为什么还不能用？</h2>
                  <p className="text-lg text-slate-500 mb-16 max-w-2xl font-medium">系统自动探测了当前运行时环境。以下是可能导致权限阻断的关键因素，请按照优先级逐一排查。 (AUTO_PROBE_V1)</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {blockingReasons.map((reason, i) => (
                      <div 
                        key={reason.id} 
                        className="group p-8 bg-white/[0.02] hover:bg-white/[0.04] rounded-[3rem] border border-white/5 transition-all flex flex-col justify-between gap-12 hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/5"
                      >
                         <div className="space-y-8">
                            <div className="flex items-center justify-between">
                               <div className="w-14 h-14 bg-rose-500/10 rounded-[1.5rem] flex items-center justify-center text-rose-400 font-black text-2xl border border-rose-500/20">
                                 {i + 1}
                               </div>
                               <div className="px-4 py-1.5 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest italic tracking-[0.2em]">Priority High</span>
                               </div>
                            </div>
                            <div>
                               <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">{reason.label}</h3>
                               <p className="text-sm text-slate-500 font-medium leading-relaxed">{reason.tip}</p>
                            </div>
                         </div>
                         <button 
                          onClick={() => handleJump(reason.targetPage as any)}
                          className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 hover:bg-indigo-400 group-hover:-translate-y-1 active:translate-y-0"
                         >
                           去对应位置处理
                           <ArrowRight className="w-4 h-4" />
                         </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {selectedMainCategory === 'diag' && (
              <motion.div 
                key="diag" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                 <div className="grid grid-cols-3 gap-8">
                    <div className="lg:col-span-1 flex flex-col gap-8">
                       <div className="glass-card rounded-[3rem] p-10 border-white/5 bg-gradient-to-b from-indigo-500/5 to-transparent">
                          <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-8">底层探针 (PROBE)</h4>
                          <div className="space-y-6">
                             {[
                               { label: 'Executor Hash', value: '0x7F8D...E5F6', status: 'verified' },
                               { label: 'Sandbox CRC', value: '77AC-82BB', status: 'verified' },
                               { label: 'System Access', value: 'RESTRICTED', status: 'warning' },
                             ].map((p, i) => (
                               <div key={i} className="flex justify-between items-center">
                                 <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{p.label}</span>
                                 <span className={cn("text-[10px] font-mono font-bold", p.status === 'verified' ? "text-indigo-400" : "text-rose-400")}>{p.value}</span>
                               </div>
                             ))}
                          </div>
                          <button className="w-full mt-10 py-5 bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-400 transition-all shadow-xl shadow-indigo-500/20">
                            重新发起探针测试
                          </button>
                       </div>
                    </div>

                    <div className="lg:col-span-2 space-y-8">
                       <div className="glass-card rounded-[3.5rem] p-12 border-white/5">
                          <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-10 flex items-center justify-between">
                            MACRO_TO_HOST_MAPPING (宿主映射)
                            <span className="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-mono text-slate-600">COUNT: 124</span>
                          </h4>
                          <div className="grid grid-cols-2 gap-6">
                            {actionCategories[selectedPermissionKey]?.map(act => (
                              <div key={act} className="p-6 bg-slate-900 border border-white/5 rounded-3xl group hover:border-indigo-500/30 transition-all cursor-help relative overflow-hidden">
                                 <div className="flex items-center gap-4 mb-4">
                                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400"><Code2 className="w-5 h-5" /></div>
                                    <p className="text-sm font-black text-white font-mono group-hover:text-indigo-300 transition-colors">{act}</p>
                                 </div>
                                 <p className="text-[10px] text-slate-600 font-medium leading-relaxed">Map to host function: <br /><span className="text-indigo-400/50">bridge.call('{act}')</span></p>
                              </div>
                            )) || <div className="col-span-2 py-20 text-center text-[10px] font-black text-slate-800 uppercase tracking-widest italic">No Mappings Found</div>}
                          </div>
                       </div>

                       <div className="glass-card rounded-[3.5rem] p-12 border-white/5 bg-[#0b1121]">
                          <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-8 flex items-center justify-between">
                            RAW_PERMISSION_PAYLOAD (底层 JSON)
                            <Copy className="w-4 h-4 text-slate-700 hover:text-white cursor-pointer transition-colors" />
                          </h4>
                          <div className="font-mono text-[11px] text-indigo-300/80 p-8 bg-black/40 rounded-3xl border border-white/5 h-[300px] overflow-y-auto leading-relaxed scrollbar-hide">
                            <pre className="whitespace-pre-wrap">{JSON.stringify(matrix, null, 2)}</pre>
                          </div>
                       </div>
                    </div>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

const StatCard: React.FC<{ label: string, value: number, icon: any, color: 'indigo' | 'teal' | 'rose' | 'emerald' }> = ({ label, value, icon: Icon, color }) => {
  const colors = {
    indigo: 'from-indigo-500/10 border-indigo-500/20 text-indigo-400',
    teal: 'from-teal-500/10 border-teal-500/20 text-teal-400',
    rose: 'from-rose-500/10 border-rose-500/20 text-rose-400',
    emerald: 'from-emerald-500/10 border-emerald-500/20 text-emerald-400',
  };

  return (
    <div className={cn(
      "glass-card rounded-[2.5rem] p-8 border bg-gradient-to-br to-transparent transition-all hover:scale-[1.02] cursor-default group spotlight-card", 
      colors[color]
    )}>
      <div className="flex items-center justify-between mb-6">
        <div className="p-2.5 rounded-xl bg-white/5 group-hover:bg-white/10 transition-all"><Icon className="w-5 h-5" /></div>
        <div className="flex gap-1">
           {[...Array(3)].map((_, i) => <div key={i} className="w-1 h-3 rounded-full bg-current opacity-20" />)}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 opacity-80">{label}</p>
        <p className="text-4xl font-black font-mono tracking-tighter text-white">{value.toString().padStart(2, '0')}</p>
      </div>
    </div>
  );
}


// --- Tab: AuditView ---
function AuditView({ pluginId }: { pluginId: string }) {
  return (
    <div className="space-y-6">
       <div className="glass-card rounded-[2.5rem] p-10">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-xl font-black text-white flex items-center gap-3">
              <Eye className="w-5 h-5 text-indigo-400" />
              合规性与审计控制
            </h2>
            <div className="flex gap-2">
               <button className="px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-xl text-xs font-bold border border-indigo-500/20">导出审计报告</button>
               <button className="p-2 glass-panel rounded-xl text-slate-500"><ListFilter className="w-5 h-5"/></button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  <th className="px-6 py-2 pb-6">Event Source</th>
                  <th className="px-6 py-2 pb-6">Action</th>
                  <th className="px-6 py-2 pb-6">Timestamp</th>
                  <th className="px-6 py-2 pb-6">Status</th>
                  <th className="px-6 py-2 pb-6">Details</th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                {[
                  { source: 'ADMIN_PANEL', action: 'STATUS_SYNC', time: '2024-03-24 10:44', status: 'Success', detail: 'Force sync triggered' },
                  { source: 'API_NODE_1', action: 'INVOKE', time: '2024-03-24 10:42', status: 'Warning', detail: 'High latency detected (1.2s)' },
                  { source: 'PLUGIN_CORE', action: 'UPDATE', time: '2024-03-24 10:30', status: 'Success', detail: 'Draft updated to v1.0.5' },
                  { source: 'SECURITY_BOX', action: 'RBAC_CHANGE', time: '2024-03-24 09:12', status: 'Critical', detail: 'Disk write access granted' },
                ].map((log, i) => (
                  <tr key={i} className="glass-surface hover:bg-white/5 transition-all cursor-default">
                    <td className="px-6 py-5 rounded-l-2xl">
                      <div className="flex items-center gap-3">
                        <Fingerprint className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-bold text-white tracking-tight">{log.source}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5"><span className="text-[10px] font-black text-slate-500 tracking-widest">{log.action}</span></td>
                    <td className="px-6 py-5 font-mono text-slate-500 text-[10px]">{log.time}</td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        "px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-widest",
                        log.status === 'Success' ? "bg-teal-500/10 text-teal-400" :
                        log.status === 'Warning' ? "bg-amber-500/10 text-amber-400" : "bg-rose-500/10 text-rose-400"
                      )}>{log.status}</span>
                    </td>
                    <td className="px-6 py-5 rounded-r-2xl text-[10px] text-slate-400">{log.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
       </div>
    </div>
  );
}

// --- Tab: GovernanceView ---
function GovernanceView({ pluginId }: { pluginId: string }) {
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-[2.5rem] p-10 border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent">
        <h2 className="text-xl font-black text-rose-400 flex items-center gap-3 mb-8">
           <AlertTriangle className="w-6 h-6" />
           治理与高风险管理
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="p-8 glass-panel rounded-[2rem] border-rose-500/10 hover:border-rose-500/30 transition-all group">
              <h3 className="text-white font-bold mb-4 flex items-center justify-between">
                <span>下架并删除插件版本</span>
                <Trash2 className="w-5 h-5 text-slate-600 group-hover:text-rose-400 transition-colors" />
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">此操作不可撤销。所有正在运行的实例将立即停止，插件代码将从全局集群同步库中抹除。</p>
              <button className="w-full py-4 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all">
                Confirm Deletion
              </button>
           </div>

           <div className="p-8 glass-panel rounded-[2rem] border-amber-500/10 hover:border-amber-500/30 transition-all group">
              <h3 className="text-white font-bold mb-4 flex items-center justify-between">
                <span>隔离信任级别设置</span>
                <ShieldCheck className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
              </h3>
              <div className="space-y-4 mb-4">
                 {[
                   { level: 'Trusted', desc: 'Full core orchestration access', active: false },
                   { level: 'Restricted', desc: 'Sandbox with limited syscalls', active: true },
                   { level: 'Untrusted', desc: 'No persistence, memory isolation', active: false }
                 ].map((opt, i) => (
                   <div key={i} className={cn(
                     "flex justify-between items-center p-4 rounded-xl border transition-all cursor-pointer",
                     opt.active ? "bg-indigo-500/10 border-indigo-500/40" : "bg-white/2 border-white/5 hover:bg-white/5"
                   )}>
                      <div>
                        <p className="text-xs font-black text-white uppercase tracking-widest">{opt.level}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{opt.desc}</p>
                      </div>
                      {opt.active && <div className="w-2 h-2 rounded-full bg-indigo-400" />}
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      <div className="glass-card rounded-[2.5rem] p-10 bg-slate-900/50">
         <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="w-20 h-20 rounded-3xl bg-slate-800 flex items-center justify-center shrink-0">
               <AlertTriangle className="w-10 h-10 text-slate-700" />
            </div>
            <div>
               <h4 className="text-white font-bold mb-1">系统灾难恢复模式 (Disaster Recovery)</h4>
               <p className="text-slate-500 text-sm">一旦核心插件发生重大故障且处于无法同步状态，管理员可以触发此模式以恢复最近一次稳定的快照。</p>
            </div>
            <button className="md:ml-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
               Run Snapshot Tool
            </button>
         </div>
      </div>
    </div>
  );
}
