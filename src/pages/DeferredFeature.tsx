import { ShieldAlert, Info, Sliders, ToggleRight } from 'lucide-react';

export default function DeferredFeature({ name, flag }: { name: string; flag: string }) {
  return (
    <div className="space-y-8 pb-10 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="p-10 glass-card rounded-[3rem] text-center max-w-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full"></div>
        
        <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center text-amber-500 mx-auto mb-8 shadow-xl shadow-amber-500/10 group-hover:scale-110 transition-transform duration-700">
           <ShieldAlert className="w-10 h-10" />
        </div>
        
        <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase italic mb-6 inline-block">
          DEFERRED FROM MIN_CORE
        </span>
        
        <h1 className="text-4xl font-bold text-white tracking-tighter mb-4">{name}</h1>
        <p className="text-slate-400 text-lg leading-relaxed mb-8">
           当前阶段我们先稳定插件、认证、RBAC 和健康检查。界面保持关闭，避免展示未完成能力。
        </p>

        <div className="flex flex-col items-center gap-4">
           <div className="px-6 py-4 glass-panel rounded-2xl flex items-center gap-4 w-full">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
                 <Sliders className="w-5 h-5" />
              </div>
              <div className="text-left flex-1">
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Feature Flag Key</p>
                 <code className="text-sm font-mono text-amber-400">{flag}</code>
              </div>
              <div className="p-2 bg-white/5 rounded-lg text-rose-400">
                 <ToggleRight className="w-6 h-6 rotate-180 opacity-50" />
              </div>
           </div>
           
           <div className="flex items-center gap-2 text-slate-500 text-xs mt-4 italic">
              <Info className="w-4 h-4" />
              <span>状态：已由后端逻辑分支隔离 / Isolated by Backend Logic</span>
           </div>
        </div>
      </div>
      
      <div className="mt-12 flex gap-6 text-[10px] font-bold tracking-[0.3em] uppercase text-slate-600">
         <span>Stability: TBD</span>
         <span>•</span>
         <span>Priority: Deferred</span>
         <span>•</span>
         <span>Version: Mock_UI</span>
      </div>
    </div>
  );
}
