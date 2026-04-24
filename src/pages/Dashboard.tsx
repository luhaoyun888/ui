import { motion } from 'motion/react';
import { ShieldCheck, Cpu, Zap, Workflow, ZapOff } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const stats = [
    { label: 'Uptime', value: '99.98%', trend: 'Stable', icon: Activity },
    { label: 'Load Time', value: '1.2s', trend: '-24%', icon: Zap },
    { label: 'Latency', value: '18ms', trend: '-2ms', icon: Cpu },
    { label: 'Coverage', value: '98.4%', trend: 'Optimal', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Hero Section */}
      <section className="glass-card rounded-[2.5rem] p-10 relative overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-1000"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="max-w-2xl">
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-bold tracking-widest uppercase mb-4 inline-block">
              Foundation Console
            </span>
            <h1 className="text-5xl font-bold text-white tracking-tighter mb-4">
              核心总览 <span className="text-indigo-400">Core Dashboard</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              这里只展示当前后端实际开放、可直接验证的基础能力。
              最小可运行核心，先接通真实后端，再逐步开放更重的能力。
            </p>
          </div>
          <div className="flex gap-4">
            <button className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-500/30 hover:bg-indigo-500 transition-all">
              运行状态检查
            </button>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-8 glass-panel rounded-[2rem] group hover:bg-white/10 transition-all cursor-default"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:text-white transition-colors duration-500">
                <stat.icon className="w-6 h-6" />
              </div>
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                stat.trend.startsWith('-') ? "text-teal-400 bg-teal-400/10" : "text-slate-500 bg-white/5"
              )}>
                {stat.trend}
              </span>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-white tracking-tighter">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Features */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-10 glass-card rounded-[3rem]">
            <h2 className="text-2xl font-bold text-white mb-6 underline decoration-indigo-500/50 underline-offset-8">最小核心能力</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { label: '插件生命周期', note: '完整覆盖创建、上传、版本管理、运行态切换。' },
                { label: 'RBAC 权限查询', note: '当前页面先提供只读接入，展示全局角色与权限。' },
                { label: '系统健康检查', note: '实时后端响应监测，原始响应 Health / Ping。' },
                { label: 'Token 验证', note: '支持开发测试 Token 与真实验证码登录。' }
              ].map((f, i) => (
                <div key={i} className="p-6 glass-surface rounded-3xl group hover:border-white/20 transition-all">
                  <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    {f.label}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-10 glass-panel rounded-[3rem]">
            <h2 className="text-2xl font-bold text-white mb-6">后续功能规划</h2>
            <div className="space-y-4">
              {[
                { label: 'AI Agent', flag: 'feature_flags.agent', reason: '暂不纳入最小核心，先稳定插件流程' },
                { label: 'Workflow', flag: 'feature_flags.workflow', reason: '能力待后端完整接通后再开放' }
              ].map((f, i) => (
                <div key={i} className="flex items-center justify-between p-6 glass-surface rounded-3xl">
                  <div>
                    <h3 className="text-white font-bold mb-1">{f.label}</h3>
                    <code className="text-[10px] text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded-lg">{f.flag}</code>
                  </div>
                  <span className="text-slate-500 text-xs italic">{f.reason}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Steps Card */}
        <div className="p-10 glass-card rounded-[3rem] h-fit">
          <h2 className="text-2xl font-bold text-white mb-8">下一步可测路径</h2>
          <div className="space-y-8">
            <div className="relative pl-10 border-l border-white/10 space-y-12 pb-2">
              {[
                { title: 'Token 授权', desc: '使用开发测试 Token 登录控制台' },
                { title: '插件管理', desc: '上传 ZIP 包，生命周期状态同步' },
                { title: '函数列表', desc: '安装加载后读取函数并完整调用' }
              ].map((step, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[51px] top-0 w-5 h-5 bg-[#0f172a] border-4 border-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)] z-10" />
                  <h4 className="text-white font-bold mb-1">{step.title}</h4>
                  <p className="text-slate-500 text-sm">{step.desc}</p>
                </div>
              ))}
            </div>
            <button className="w-full py-4 glass-panel rounded-2xl text-indigo-400 font-bold hover:bg-indigo-500 hover:text-white transition-all duration-500">
              开始导航指引
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Activity(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}
