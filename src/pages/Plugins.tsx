import React from 'react';
import { 
  Puzzle, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Play, 
  Settings, 
  Code2,
  X,
  History,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const plugins = [
  { id: 1, name: 'Data Transformer', version: '1.0.4', status: 'Loaded', type: 'Go', lastUsed: '10 mins ago', author: 'System', description: 'Advanced data mapping and transformation engine.' },
  { id: 2, name: 'Slack Notifier', version: '2.1.0', status: 'Installed', type: 'JavaScript', lastUsed: '2 hours ago', author: 'DevTeam', description: 'Send automated notifications to Slack channels.' },
  { id: 3, name: 'Image Processor', version: '0.9.2', status: 'Error', type: 'Go', lastUsed: 'Yesterday', author: 'System', description: 'High-performance image resizing and optimization.' },
  { id: 4, name: 'PDF Generator', version: '1.5.0', status: 'Loaded', type: 'JavaScript', lastUsed: '5 mins ago', author: 'Admin', description: 'Generate professional PDF documents from HTML templates.' },
];

export default function Plugins() {
  const [selectedPlugin, setSelectedPlugin] = React.useState<any>(null);
  const [activeTab, setActiveTab] = React.useState<'list' | 'invoke'>('list');
  const [isInvoking, setIsInvoking] = React.useState(false);
  const [invocationResult, setInvocationResult] = React.useState<string | null>(null);

  const handleInvoke = () => {
    setIsInvoking(true);
    setInvocationResult(null);
    setTimeout(() => {
      setIsInvoking(false);
      setInvocationResult(JSON.stringify({
        status: "success",
        execution_time: "42ms",
        timestamp: new Date().toISOString(),
        result: {
          output: "Processed data successfully",
          metadata: {
            version: "1.0.4",
            engine: "wasm-v8",
            random_id: Math.floor(Math.random() * 1000000)
          }
        }
      }, null, 2));
    }, 1500);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Plugins</h1>
          <p className="text-slate-500 mt-2">Manage your system extensions and custom logic.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setActiveTab('invoke')}
            className={cn(
              "px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all",
              activeTab === 'invoke' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            <Play className="w-5 h-5" />
            Invocation Panel
          </button>
          <button className="bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all">
            <Plus className="w-5 h-5" />
            Create Plugin
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 bg-white border border-slate-200 rounded-xl px-4 flex items-center gap-3 focus-within:border-indigo-500 transition-colors shadow-sm">
                <Search className="w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search by name, author or type..." 
                  className="flex-1 py-3 outline-none text-sm text-slate-600"
                />
              </div>
              <button className="bg-white border border-slate-200 px-4 py-3 rounded-xl flex items-center gap-2 text-slate-600 hover:bg-slate-50 font-medium shadow-sm">
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>

            {/* Plugins Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plugins.map((plugin) => (
                <div 
                  key={plugin.id} 
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer"
                  onClick={() => setSelectedPlugin(plugin)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <Puzzle className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">{plugin.name}</h3>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">by {plugin.author} • v{plugin.version}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      plugin.status === 'Loaded' ? "bg-emerald-50 text-emerald-600" :
                      plugin.status === 'Installed' ? "bg-blue-50 text-blue-600" : "bg-rose-50 text-rose-600"
                    )}>
                      {plugin.status}
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-slate-500 leading-relaxed line-clamp-2">
                    {plugin.description}
                  </p>
                  <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Code2 className="w-4 h-4" />
                      <span className="text-xs font-medium">{plugin.type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                        <Play className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="invoke"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800">Invocation Panel</h2>
                <button 
                  onClick={() => setActiveTab('list')}
                  className="text-sm font-bold text-indigo-600 hover:text-indigo-700"
                >
                  Back to List
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Select Plugin</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-indigo-500 transition-all text-slate-600 appearance-none">
                    {plugins.map(p => <option key={p.id} value={p.id}>{p.name} (v{p.version})</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Function Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. TransformData" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-indigo-500 transition-all text-slate-600"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Arguments (JSON)</label>
                  <textarea 
                    rows={6}
                    placeholder='{"input": "data", "options": { "verbose": true }}'
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-indigo-500 transition-all text-slate-600 font-mono text-sm"
                  />
                </div>

                <button 
                  onClick={handleInvoke}
                  disabled={isInvoking}
                  className={cn(
                    "w-full bg-indigo-600 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100",
                    isInvoking ? "opacity-70 cursor-not-allowed" : "hover:bg-indigo-700"
                  )}
                >
                  {isInvoking ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current" />
                      Execute Call
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-400" />
                  Execution Result
                </h2>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">JSON Output</span>
              </div>
              <div className="flex-1 bg-slate-800/50 rounded-xl p-6 font-mono text-sm text-indigo-300 overflow-auto border border-slate-800">
                {invocationResult ? (
                  <pre>{invocationResult}</pre>
                ) : (
                  <p className="text-slate-500 italic">Waiting for execution...</p>
                )}
              </div>
              <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
                <span>Memory: 12.4MB</span>
                <span>CPU: 0.2%</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plugin Detail Modal */}
      <AnimatePresence>
        {selectedPlugin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPlugin(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
                    <Puzzle className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{selectedPlugin.name}</h2>
                    <p className="text-sm text-slate-500">Plugin ID: {selectedPlugin.id} • Author: {selectedPlugin.author}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedPlugin(null)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              
              <div className="p-8 space-y-8">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Description</h3>
                  <p className="text-slate-600 leading-relaxed">{selectedPlugin.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Current Version</p>
                    <p className="text-lg font-bold text-slate-800">v{selectedPlugin.version}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Runtime Environment</p>
                    <p className="text-lg font-bold text-slate-800">{selectedPlugin.type}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Version Management</h3>
                  <div className="space-y-3">
                    {[
                      { v: '1.0.4', date: '2024-03-10', status: 'Active' },
                      { v: '1.0.3', date: '2024-02-15', status: 'Archived' },
                      { v: '1.0.2', date: '2024-01-20', status: 'Archived' },
                    ].map((v) => (
                      <div key={v.v} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-800">v{v.v}</span>
                          <span className="text-xs text-slate-400">{v.date}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full",
                            v.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                          )}>{v.status}</span>
                          <button className="text-indigo-600 hover:text-indigo-700 font-bold text-xs uppercase tracking-wider">Manage</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                <button className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                  Load Plugin
                </button>
                <button className="flex-1 bg-white border border-slate-200 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-50 transition-all">
                  Permissions
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
