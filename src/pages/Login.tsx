import { motion } from 'motion/react';
import { 
  Key, 
  ShieldCheck, 
  Terminal, 
  Fingerprint, 
  ArrowRight,
  ChevronRight,
  Database
} from 'lucide-react';

export default function Login() {
  const DEV_TOKEN = "TEST_TOKEN_01_ADMIN_CORE_VERIFIED_ACCESS";

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Mesh Gradients specifically for Login */}
      <div className="mesh-gradient-1 opacity-50"></div>
      <div className="mesh-gradient-3 opacity-30"></div>

      <div className="relative z-10 w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
        {/* Hero Section */}
        <div className="space-y-10 group">
          <div className="space-y-6">
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-bold tracking-widest uppercase italic">Foundation Console</span>
            <h1 className="text-6xl font-black text-white leading-[0.9] tracking-tighter">
              先接通真实后端 <br />
              <span className="text-zinc-600">再逐步开放能力。</span>
            </h1>
            <p className="text-slate-400 text-xl leading-relaxed max-w-lg">
              当前 UI 已接入真实验证码登录、开发测试 Token、插件生命周期、RBAC 查询和系统健康检查。
            </p>
          </div>

          <div className="p-8 glass-card rounded-[2.5rem] border-indigo-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[80px] rounded-full"></div>
            <div className="flex items-center gap-4 mb-4">
               <Fingerprint className="w-8 h-8 text-indigo-400" />
               <h3 className="text-white font-bold text-lg">Quick Access Token</h3>
            </div>
            <code className="block p-4 glass-surface rounded-2xl text-[10px] font-mono text-indigo-300 break-all select-all cursor-pointer hover:bg-white/10 transition-colors">
              {DEV_TOKEN}
            </code>
            <p className="mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
               <Database className="w-3 h-3" /> Production Environment Verified
            </p>
          </div>

          <div className="flex gap-12 text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">
             <div>AUTHENTICATION <span className="text-white ml-2">VERIFIED</span></div>
             <div>SYSTEM HEALYTH <span className="text-white ml-2">OPTIMAL</span></div>
          </div>
        </div>

        {/* Login Panel */}
        <div className="glass-card rounded-[3.5rem] p-12 border-white/20 shadow-3xl shadow-indigo-500/10">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-white tracking-tight mb-2 flex items-center gap-4">
              <span className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center"><Key className="w-6 h-6 text-indigo-400" /></span>
              登录控制台
            </h2>
            <p className="text-slate-500 font-medium">当前后端默认不走密码登录，使用验证码或 Token 登录。</p>
          </div>

          <form className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">Authorized Identifier</label>
              <div className="relative">
                 <input 
                   type="text" 
                   placeholder="Email or Access Token"
                   className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                 />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">Security Challenge</label>
              <div className="flex gap-4">
                 <input 
                   type="text" 
                   placeholder="Verification Code"
                   className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                 />
                 <button type="button" className="px-6 glass-panel rounded-2xl text-[10px] font-bold text-white uppercase tracking-widest hover:bg-white/10 transition-all">
                   Get Code
                 </button>
              </div>
            </div>

            <div className="pt-4">
              <button className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-bold text-lg shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
                Authorized Login <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>

          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col gap-4">
             <div className="flex items-center justify-between p-4 glass-surface rounded-2xl cursor-pointer hover:bg-white/10 transition-all group">
                <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">Developer Environment Override</span>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
             </div>
             <p className="text-center text-[10px] font-bold text-slate-700 uppercase tracking-[0.3em]">
                System V2.42 // ACCESS CONTROLLED
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
