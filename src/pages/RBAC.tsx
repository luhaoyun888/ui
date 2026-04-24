import React from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Search, 
  Users, 
  Key, 
  Lock, 
  ChevronRight, 
  MoreVertical,
  Shield,
  UserCheck,
  Globe,
  Database
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

const roles = [
  { id: 'ROLE-001', name: 'Administrator', users: 3, permissions: 'All Access', status: 'system' },
  { id: 'ROLE-002', name: 'Developer', users: 12, permissions: 'Plugin Manage, Workflow Edit', status: 'custom' },
  { id: 'ROLE-003', name: 'Operator', users: 45, permissions: 'Edge Monitor, Run Workflow', status: 'custom' },
  { id: 'ROLE-004', name: 'Security Auditor', users: 2, permissions: 'Read Only, Audit Logs', status: 'custom' },
  { id: 'ROLE-005', name: 'Guest', users: 0, permissions: 'View Dashboard', status: 'system' },
];

const policies = [
  { id: 'POL-001', name: 'Standard Edge Isolation', target: 'Edge Devices', type: 'Network', status: 'Enforced' },
  { id: 'POL-002', name: 'Plugin Resource Quota', target: 'All Plugins', type: 'Resources', status: 'Enforced' },
  { id: 'POL-003', name: 'Admin MFA Requirement', target: 'Admin Role', type: 'Auth', status: 'Draft' },
];

export default function RBAC() {
  const [activeTab, setActiveTab] = React.useState<'roles' | 'policies'>('roles');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">RBAC & Policies</h1>
          <p className="text-slate-500 mt-2">Manage access control and system-wide security policies.</p>
        </div>
        <button className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
          <Plus className="w-5 h-5" />
          {activeTab === 'roles' ? 'Create Role' : 'Create Policy'}
        </button>
      </div>

      <div className="flex gap-1 bg-white p-1 rounded-2xl border border-slate-200 w-fit shadow-sm">
        <button 
          onClick={() => setActiveTab('roles')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
            activeTab === 'roles' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <Users className="w-4 h-4" />
          Roles & Permissions
        </button>
        <button 
          onClick={() => setActiveTab('policies')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
            activeTab === 'policies' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <Shield className="w-4 h-4" />
          Security Policies
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 bg-white border border-slate-200 rounded-xl px-4 flex items-center gap-3 focus-within:border-indigo-500 transition-colors shadow-sm">
              <Search className="w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder={activeTab === 'roles' ? "Search roles..." : "Search policies..."} 
                className="flex-1 py-3 outline-none text-sm text-slate-600"
              />
            </div>
          </div>

          {activeTab === 'roles' ? (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Users</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Permissions</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roles.map((role) => (
                    <tr key={role.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                            role.status === 'system' ? "bg-slate-100 text-slate-600" : "bg-indigo-50 text-indigo-600"
                          )}>
                            <UserCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{role.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{role.status} role</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-700">{role.users}</span>
                          <span className="text-xs text-slate-400">members</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-500 font-medium">{role.permissions}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {policies.map((policy) => (
                <div key={policy.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
                      <Shield className="w-6 h-6" />
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      policy.status === 'Enforced' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                    )}>
                      {policy.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">{policy.name}</h3>
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Target</span>
                      <span className="text-slate-700 font-bold">{policy.target}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Type</span>
                      <span className="text-slate-700 font-bold">{policy.type}</span>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-slate-50 flex gap-2">
                    <button className="flex-1 bg-slate-50 text-slate-600 font-bold py-2 rounded-xl text-xs hover:bg-slate-100 transition-all">
                      Configure
                    </button>
                    <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                      <Lock className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-400" />
              Security Overview
            </h2>
            <div className="space-y-6">
              <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-800">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Global Permissions</p>
                <p className="text-2xl font-black text-white">42</p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-800">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Active Policies</p>
                <p className="text-2xl font-black text-emerald-400">18</p>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-medium text-slate-300">Public Access: Disabled</span>
              </div>
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-medium text-slate-300">Audit Logging: Enabled</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Recent Changes</h2>
            <div className="space-y-6">
              {[
                { user: 'Admin', action: 'Updated Policy POL-001', time: '2h ago' },
                { user: 'Security', action: 'Created Role ROLE-004', time: '5h ago' },
                { user: 'Admin', action: 'Revoked access for user_42', time: '1d ago' },
              ].map((log, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">
                    {log.user[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{log.action}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{log.time} by {log.user}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-2">
              View Audit Logs <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
