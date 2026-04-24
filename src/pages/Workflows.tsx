import React from 'react';
import { 
  GitBranch, 
  Plus, 
  Search, 
  Play, 
  Pause, 
  Trash2, 
  Clock, 
  Zap, 
  ChevronRight,
  MoreVertical,
  Activity,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

const workflows = [
  { id: 'WF-001', name: 'Daily Backup Pipeline', status: 'active', triggers: 'Daily at 02:00', lastRun: '3 hours ago', successRate: '98%', steps: 5 },
  { id: 'WF-002', name: 'Slack Alert Handler', status: 'active', triggers: 'On Error Alert', lastRun: '15 mins ago', successRate: '100%', steps: 3 },
  { id: 'WF-003', name: 'Data Cleanup Sync', status: 'paused', triggers: 'Weekly', lastRun: '2 days ago', successRate: '95%', steps: 4 },
  { id: 'WF-004', name: 'Edge Node Provisioning', status: 'active', triggers: 'Manual', lastRun: 'Yesterday', successRate: '100%', steps: 8 },
  { id: 'WF-005', name: 'Security Audit Scan', status: 'error', triggers: 'Every 6 hours', lastRun: '1 hour ago', successRate: '82%', steps: 6 },
];

export default function Workflows() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Workflows</h1>
          <p className="text-slate-500 mt-2">Automate complex tasks across plugins and edge devices.</p>
        </div>
        <button className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
          <Plus className="w-5 h-5" />
          Create Workflow
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Workflow List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 bg-white border border-slate-200 rounded-xl px-4 flex items-center gap-3 focus-within:border-indigo-500 transition-colors shadow-sm">
              <Search className="w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search workflows..." 
                className="flex-1 py-3 outline-none text-sm text-slate-600"
              />
            </div>
            <button className="bg-white border border-slate-200 px-4 py-3 rounded-xl flex items-center gap-2 text-slate-600 hover:bg-slate-50 font-medium shadow-sm">
              Status: All
            </button>
          </div>

          <div className="space-y-4">
            {workflows.map((wf) => (
              <div key={wf.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                      wf.status === 'active' ? "bg-emerald-50 text-emerald-600" :
                      wf.status === 'paused' ? "bg-slate-50 text-slate-400" : "bg-rose-50 text-rose-600"
                    )}>
                      <GitBranch className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">{wf.name}</h3>
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{wf.id} • {wf.steps} Steps</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      wf.status === 'active' ? "bg-emerald-50 text-emerald-600" :
                      wf.status === 'paused' ? "bg-slate-100 text-slate-500" : "bg-rose-50 text-rose-600"
                    )}>
                      {wf.status}
                    </span>
                    <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-all">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-4 py-4 border-y border-slate-50">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Trigger</p>
                    <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      {wf.triggers}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Last Run</p>
                    <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {wf.lastRun}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Success Rate</p>
                    <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-emerald-500" />
                      {wf.successRate}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-400">
                        P{i}
                      </div>
                    ))}
                    <div className="w-8 h-8 rounded-full bg-indigo-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-600">
                      +2
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2">
                      <Play className="w-3.5 h-3.5 fill-current" /> Run
                    </button>
                    <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Workflow Stats</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-slate-600">Successful Runs</span>
                </div>
                <span className="text-lg font-black text-slate-900">1,242</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-slate-600">Failed Runs</span>
                </div>
                <span className="text-lg font-black text-slate-900">14</span>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-slate-50">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Top Triggered</p>
              <div className="space-y-3">
                {['Slack Alert Handler', 'Daily Backup Pipeline'].map(name => (
                  <div key={name} className="flex items-center justify-between group cursor-pointer">
                    <span className="text-sm font-medium text-slate-600 group-hover:text-indigo-600 transition-colors">{name}</span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-100">
            <h3 className="text-xl font-bold mb-4">AI Builder</h3>
            <p className="text-indigo-100 text-sm leading-relaxed mb-6">
              Describe a workflow in natural language and let the agent build it for you.
            </p>
            <div className="bg-indigo-500 rounded-2xl p-4 border border-indigo-400">
              <p className="text-xs italic text-indigo-200">"When a new device connects, run a security scan and notify me on Slack if any vulnerabilities are found."</p>
            </div>
            <button className="w-full mt-6 bg-white text-indigo-600 font-bold py-3 rounded-xl hover:bg-indigo-50 transition-all">
              Launch AI Builder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
