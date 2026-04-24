import React from 'react';
import { 
  Activity, 
  Server, 
  Database, 
  Network, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  BarChart3,
  Cpu,
  HardDrive
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { systemService } from '@/src/services/api';

const healthChecks = [
  { name: 'API Gateway', status: 'healthy', latency: '12ms', uptime: '99.99%' },
  { name: 'MySQL Database', status: 'healthy', latency: '5ms', uptime: '100%' },
  { name: 'Redis Cache', status: 'healthy', latency: '2ms', uptime: '99.95%' },
  { name: 'Runtime Engine', status: 'healthy', latency: '45ms', uptime: '99.90%' },
  { name: 'Edge Gateway', status: 'warning', latency: '250ms', uptime: '98.5%' },
];

export default function SystemHealth() {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">System Health</h1>
          <p className="text-slate-500 mt-2">Real-time monitoring of infrastructure and core services.</p>
        </div>
        <button 
          onClick={handleRefresh}
          className="bg-white border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2 text-slate-600 hover:bg-slate-50 font-bold transition-all"
        >
          <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          Refresh Status
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Health Checks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                Service Status
              </h2>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">All Systems Operational</span>
            </div>
            <div className="divide-y divide-slate-50">
              {healthChecks.map((check) => (
                <div key={check.name} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      check.status === 'healthy' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {check.status === 'healthy' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{check.name}</p>
                      <p className="text-xs text-slate-400">Uptime: {check.uptime}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-medium text-slate-600">{check.latency}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Latency</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                <Cpu className="w-4 h-4 text-indigo-600" />
                CPU Usage
              </h3>
              <div className="flex items-end gap-1 h-32">
                {[40, 35, 55, 45, 60, 50, 40, 30, 45, 50, 65, 55, 45].map((val, i) => (
                  <div 
                    key={i} 
                    className="flex-1 bg-indigo-100 rounded-t-sm hover:bg-indigo-400 transition-colors cursor-help"
                    style={{ height: `${val}%` }}
                    title={`${val}% Usage`}
                  />
                ))}
              </div>
              <div className="mt-4 flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span>10m ago</span>
                <span>Now</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                <HardDrive className="w-4 h-4 text-indigo-600" />
                Memory Usage
              </h3>
              <div className="flex items-end gap-1 h-32">
                {[70, 72, 75, 73, 70, 68, 70, 72, 75, 78, 80, 75, 72].map((val, i) => (
                  <div 
                    key={i} 
                    className="flex-1 bg-slate-100 rounded-t-sm hover:bg-indigo-400 transition-colors cursor-help"
                    style={{ height: `${val}%` }}
                    title={`${val}% Usage`}
                  />
                ))}
              </div>
              <div className="mt-4 flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span>10m ago</span>
                <span>Now</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl">
            <h2 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-400" />
              Environment Info
            </h2>
            <div className="space-y-4">
              {[
                { label: 'OS', value: 'Linux (Ubuntu 22.04)' },
                { label: 'Go Version', value: '1.21.5' },
                { label: 'MySQL', value: '8.0.35' },
                { label: 'Redis', value: '7.2.3' },
                { label: 'Region', value: 'us-east-1' },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0">
                  <span className="text-xs text-slate-400 font-medium">{item.label}</span>
                  <span className="text-xs font-mono text-indigo-300">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Prometheus Metrics
            </h2>
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">HTTP Requests</p>
                <p className="text-lg font-mono font-bold text-slate-800">142,502</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Active Connections</p>
                <p className="text-lg font-mono font-bold text-slate-800">1,204</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Error Rate</p>
                <p className="text-lg font-mono font-bold text-rose-600">0.02%</p>
              </div>
            </div>
            <button className="w-full mt-6 text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-2">
              View Raw Metrics <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArrowUpRight(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>
  )
}
