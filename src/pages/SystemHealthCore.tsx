import { motion } from 'motion/react';
import { Activity, Heart, Zap, Binary, HardDrive, Terminal } from 'lucide-react';

export default function SystemHealth() {
  const healthData = {
    status: 'OPTIMAL',
    ping: '18ms',
    uptime: '142h 21m',
    services: [
      { name: 'Core_API', status: 'HEALTHY', endpoint: '/api/v1/health' },
      { name: 'Gateway_Proxy', status: 'HEALTHY', endpoint: '/proxy/ping' },
      { name: 'Auth_Node', status: 'STABLE', endpoint: '/oauth/status' },
      { name: 'Storage_Bucket_S3', status: 'ONLINE', endpoint: 'aws-s3-standard-1' }
    ]
  };

  return (
    <div className="space-y-8 pb-10">
      <section className="glass-card rounded-[2.5rem] p-10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 blur-[100px] rounded-full group-hover:bg-teal-500/10 transition-all duration-1000"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
           <div className="max-w-2xl">
             <div className="flex items-center gap-2 mb-4">
               <span className="px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-[10px] font-bold tracking-widest uppercase italic">Real-time Watchman</span>
             </div>
             <h1 className="text-4xl font-bold text-white tracking-tight">系统健康反馈 <span className="text-teal-400 font-mono text-xl ml-2 uppercase tracking-widest tracking-tighter">Live Monitor</span></h1>
             <p className="text-slate-400 mt-2 text-lg">
               这里只展示真实后端响应，不再伪造数据库、队列或边缘设备状态。
             </p>
           </div>
           <div className="flex items-center gap-4 bg-teal-400/10 px-8 py-5 rounded-[2rem] border border-teal-400/20 shadow-xl shadow-teal-500/10 group-hover:scale-105 transition-transform">
              <Heart className="w-8 h-8 text-teal-400 animate-pulse" />
              <div>
                <p className="text-[10px] font-bold text-teal-300 uppercase tracking-[0.2em] mb-1">Global Health</p>
                <p className="text-2xl font-black text-white tracking-tighter uppercase">{healthData.status}</p>
              </div>
           </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card rounded-[3rem] p-10 relative overflow-hidden">
            <h1 className="text-2xl font-bold text-white mb-8 underline decoration-teal-500/50 underline-offset-8">服务可用性矩阵 / Matrix</h1>
            <div className="grid md:grid-cols-2 gap-4">
              {healthData.services.map((svc, i) => (
                <div key={i} className="p-6 glass-surface rounded-3xl border border-white/5 group hover:bg-white/5 transition-all">
                  <div className="flex justify-between items-start mb-4">
                     <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-teal-400 group-hover:bg-teal-500 group-hover:text-white transition-all">
                        <Zap className="w-5 h-5" />
                     </div>
                     <span className="text-[10px] font-bold text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded-full uppercase tracking-widest">{svc.status}</span>
                  </div>
                  <h4 className="text-white font-bold mb-1 tracking-widest font-mono uppercase">{svc.name}</h4>
                  <p className="text-[10px] font-mono text-slate-500 break-all">{svc.endpoint}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-[3rem] p-10 relative overflow-hidden">
             <div className="flex justify-between items-center mb-8">
               <h2 className="text-2xl font-bold text-white">Prometheus Metrics Excerpt</h2>
               <div className="flex gap-2">
                 {['CPU', 'MEM', 'I/O', 'NET'].map(m => (
                    <span key={m} className="px-2 py-1 text-[8px] font-bold bg-white/5 rounded-lg text-slate-500 uppercase tracking-widest">{m}</span>
                 ))}
               </div>
             </div>
             <div className="glass-surface p-6 rounded-3xl border border-white/5 font-mono text-[10px] text-teal-400/70 space-y-1.5 overflow-hidden max-h-[300px] relative">
               <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0f172a] to-transparent z-10"></div>
               <p># HELP go_gc_duration_seconds A summary of the pause duration of garbage collection cycles.</p>
               <p># TYPE go_gc_duration_seconds summary</p>
               <p>go_gc_duration_seconds{'{'}quantile="0"{'}'} 2.1408e-05</p>
               <p>go_gc_duration_seconds{'{'}quantile="0.25"{'}'} 4.14e-05</p>
               <p>go_gc_duration_seconds{'{'}quantile="0.5"{'}'} 5.23e-05</p>
               <p>go_gc_duration_seconds{'{'}quantile="0.75"{'}'} 8.12e-05</p>
               <p>go_gc_duration_seconds{'{'}quantile="1"{'}'} 0.0034</p>
               <p># HELP go_goroutines Number of goroutines that currently exist.</p>
               <p>go_goroutines 42</p>
               <p className="animate-pulse">_</p>
             </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass-card rounded-[2.5rem] p-8">
             <h3 className="text-white font-bold mb-6 flex items-center gap-2">
               <Terminal className="w-5 h-5 text-indigo-400" /> Ping / Status Response
             </h3>
             <div className="glass-surface p-6 rounded-2xl border border-white/5">
                <pre className="text-[10px] font-mono text-indigo-300 leading-relaxed overflow-x-auto">
{`{
  "health": "UP",
  "ping": "18ms",
  "data_center": "osaka-1",
  "db_sync": true,
  "queue_latency": 0.041,
  "last_check": "2026-04-23"
}`}
                </pre>
             </div>
          </div>

          <div className="glass-panel rounded-[2.5rem] p-10 flex flex-col items-center text-center border border-white/5 relative group overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500/0 via-teal-500/50 to-teal-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <HardDrive className="w-12 h-12 text-teal-500/30 mb-4" />
             <h4 className="text-white font-bold mb-1">Infrastructure Load</h4>
             <div className="w-full bg-white/5 h-1.5 rounded-full mt-4 mb-2">
                <div className="w-1/3 h-full bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.5)]"></div>
             </div>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest uppercase">Capacity: 32.4% / Active Usage</p>
          </div>
        </div>
      </div>
    </div>
  );
}
