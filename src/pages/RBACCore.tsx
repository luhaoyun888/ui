import { motion } from 'motion/react';
import { ShieldCheck, Lock, UserCheck, ShieldAlert, Key } from 'lucide-react';

export default function RBAC() {
  return (
    <div className="space-y-8 pb-10">
      <section className="glass-card rounded-[2.5rem] p-10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 blur-[100px] rounded-full group-hover:bg-pink-500/10 transition-all duration-1000"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
             <span className="px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full text-[10px] font-bold tracking-widest uppercase italic">Console Authority</span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">RBAC 权限管理 <span className="text-pink-400 font-mono text-xl ml-2 tracking-widest uppercase">ReadOnly</span></h1>
          <p className="text-slate-400 mt-2 max-w-2xl leading-relaxed">
            当前页面先提供只读接入，展示全局角色与权限列表。先接通真实后端，再逐步开放更重的能力。
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card rounded-[3rem] p-10">
            <h2 className="text-2xl font-bold text-white mb-8 underline decoration-pink-500/50 underline-offset-8">权限矩阵角色预览</h2>
            <div className="space-y-4">
              {[
                { role: 'SYSTEM_ADMIN', desc: 'Full access to core plugins, infrastructure metrics, and global RBAC settings.' },
                { role: 'DEVELOPER', desc: 'Manage plugins life-cycle, view system health, and call remote procedures.' },
                { role: 'SECURITY_AUDITOR', desc: 'ReadOnly access to system logs, RBAC matrix, and security events.' }
              ].map((role, i) => (
                <div key={i} className="p-6 glass-surface rounded-3xl border border-white/5 group hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 bg-pink-500/10 rounded-xl flex items-center justify-center text-pink-400 group-hover:bg-pink-500 group-hover:text-white transition-all">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <h4 className="text-white font-bold tracking-widest font-mono">{role.role}</h4>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">{role.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 glass-panel rounded-[2.5rem] border border-pink-500/20">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
               <ShieldAlert className="w-5 h-5 text-pink-400" /> 当前运行边界 / Logic Boundary
            </h3>
            <p className="text-sm text-pink-300/80 leading-relaxed">
              这里先展示角色与权限数据，策略写操作仍待后端完整接通后再开放。界面锁定在只读态，任何写请求都将被 Mock Proxy 或远程 403 拦截。
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass-card rounded-[2.5rem] p-8">
            <h3 className="text-white font-bold mb-6 flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-400" /> 全局权限集
            </h3>
            <div className="space-y-3">
              {['PLUGIN_READ', 'PLUGIN_WRITE', 'PLUGIN_DELETE', 'METRICS_READ', 'RBAC_READ', 'LOGS_VIEW', 'SYSTEM_REBOOT'].map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 glass-surface rounded-xl group transition-all">
                  <span className="text-[10px] font-bold font-mono text-slate-400 group-hover:text-white transition-colors tracking-widest uppercase">{p}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)]" />
                </div>
              ))}
            </div>
          </div>

          <div className="glass-surface rounded-[2.5rem] p-10 text-center border border-white/5 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-pink-500/5"></div>
             <ShieldCheck className="w-12 h-12 text-indigo-500/30 mx-auto mb-4" />
             <h4 className="text-white font-bold mb-2">Policy Synchronizer</h4>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 leading-relaxed">Last global sync: 4m ago</p>
             <button className="relative z-10 px-6 py-2 glass-panel rounded-xl text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all">
               Deep Verify Policies
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
