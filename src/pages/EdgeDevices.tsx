import React from 'react';
import { 
  Cpu, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Activity, 
  Wifi, 
  WifiOff, 
  Shield, 
  MapPin,
  RefreshCw,
  Settings,
  Terminal,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const devices = [
  { id: 'EDGE-001', name: 'Gateway-North-01', status: 'online', type: 'Industrial Gateway', location: 'New York, US', ip: '192.168.1.10', cpu: '12%', mem: '45%', lastSeen: 'Just now' },
  { id: 'EDGE-002', name: 'Sensor-Hub-East', status: 'online', type: 'IoT Hub', location: 'London, UK', ip: '10.0.0.42', cpu: '5%', mem: '20%', lastSeen: '2 mins ago' },
  { id: 'EDGE-003', name: 'Vision-Node-A', status: 'warning', type: 'AI Vision Node', location: 'Tokyo, JP', ip: '172.16.0.5', cpu: '88%', mem: '92%', lastSeen: '5 mins ago' },
  { id: 'EDGE-004', name: 'Controller-Main', status: 'offline', type: 'PLC Controller', location: 'Berlin, DE', ip: '192.168.1.50', cpu: '0%', mem: '0%', lastSeen: '2 hours ago' },
  { id: 'EDGE-005', name: 'Gateway-South-02', status: 'online', type: 'Industrial Gateway', location: 'Sydney, AU', ip: '192.168.2.11', cpu: '15%', mem: '48%', lastSeen: 'Just now' },
  { id: 'EDGE-006', name: 'Storage-Node-01', status: 'online', type: 'Edge Storage', location: 'San Francisco, US', ip: '10.0.5.100', cpu: '25%', mem: '85%', lastSeen: '1 min ago' },
  { id: 'EDGE-007', name: 'Robot-Arm-Ctrl', status: 'online', type: 'Motion Controller', location: 'Seoul, KR', ip: '192.168.10.5', cpu: '42%', mem: '30%', lastSeen: 'Just now' },
  { id: 'EDGE-008', name: 'Env-Monitor-04', status: 'warning', type: 'Sensor Node', location: 'Paris, FR', ip: '10.0.2.15', cpu: '10%', mem: '15%', lastSeen: '10 mins ago' },
];

export default function EdgeDevices() {
  const [selectedDevice, setSelectedDevice] = React.useState<any>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState('all');

  const filteredDevices = devices.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Edge Devices</h1>
          <p className="text-slate-500 mt-2">Manage and monitor your distributed edge infrastructure.</p>
        </div>
        <button className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
          <Plus className="w-5 h-5" />
          Provision Device
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Stats Summary */}
        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Devices', value: '124', icon: Cpu, color: 'indigo' },
            { label: 'Online Now', value: '118', icon: Wifi, color: 'emerald' },
            { label: 'Warnings', value: '4', icon: Activity, color: 'amber' },
            { label: 'Offline', value: '2', icon: WifiOff, color: 'rose' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                stat.color === 'indigo' ? "bg-indigo-50 text-indigo-600" :
                stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                stat.color === 'amber' ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
              )}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters & List */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 bg-white border border-slate-200 rounded-xl px-4 flex items-center gap-3 focus-within:border-indigo-500 transition-colors shadow-sm">
              <Search className="w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by name, ID or IP..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 py-3 outline-none text-sm text-slate-600"
              />
            </div>
            <div className="flex gap-2">
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 outline-none focus:border-indigo-500 shadow-sm"
              >
                <option value="all">All Status</option>
                <option value="online">Online</option>
                <option value="warning">Warning</option>
                <option value="offline">Offline</option>
              </select>
              <button className="bg-white border border-slate-200 px-4 py-3 rounded-xl flex items-center gap-2 text-slate-600 hover:bg-slate-50 font-medium shadow-sm">
                <Filter className="w-4 h-4" />
                More Filters
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Device Info</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Resources</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDevices.map((device) => (
                  <tr 
                    key={device.id} 
                    className={cn(
                      "hover:bg-slate-50 transition-colors group cursor-pointer",
                      selectedDevice?.id === device.id && "bg-indigo-50/30"
                    )}
                    onClick={() => setSelectedDevice(device)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                          device.status === 'online' ? "bg-emerald-50 text-emerald-600" :
                          device.status === 'warning' ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-400"
                        )}>
                          <Cpu className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{device.name}</p>
                          <p className="text-xs text-slate-400">{device.id} • {device.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        device.status === 'online' ? "bg-emerald-50 text-emerald-600" :
                        device.status === 'warning' ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                      )}>
                        {device.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">{device.location}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 ml-5 font-mono">{device.ip}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1.5 w-24">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400">
                          <span>CPU</span>
                          <span>{device.cpu}</span>
                        </div>
                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all",
                              parseInt(device.cpu) > 80 ? "bg-rose-500" : "bg-indigo-500"
                            )} 
                            style={{ width: device.cpu }}
                          />
                        </div>
                      </div>
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
        </div>

        {/* Device Detail Sidebar */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {selectedDevice ? (
              <motion.div
                key={selectedDevice.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-8"
              >
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      selectedDevice.status === 'online' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {selectedDevice.status}
                    </span>
                    <button className="p-1.5 hover:bg-white rounded-lg transition-all text-slate-400">
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedDevice.name}</h2>
                  <p className="text-xs text-slate-500 mt-1">{selectedDevice.id}</p>
                </div>

                <div className="p-6 space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">CPU Load</p>
                      <p className="text-lg font-bold text-slate-800">{selectedDevice.cpu}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Memory</p>
                      <p className="text-lg font-bold text-slate-800">{selectedDevice.mem}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Network Info</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">IP Address</span>
                        <span className="text-xs font-mono font-medium text-slate-700">{selectedDevice.ip}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">MAC Address</span>
                        <span className="text-xs font-mono font-medium text-slate-700">00:1A:2B:3C:4D:5E</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Last Seen</span>
                        <span className="text-xs font-medium text-slate-700">{selectedDevice.lastSeen}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Security</h3>
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3">
                      <Shield className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-700">Policy: Standard-Edge</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex gap-3">
                    <button className="flex-1 bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition-all text-sm flex items-center justify-center gap-2">
                      <Terminal className="w-4 h-4" /> SSH
                    </button>
                    <button className="flex-1 bg-white border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl hover:bg-slate-50 transition-all text-sm">
                      Logs
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                <Cpu className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-sm font-bold text-slate-400">Select a device to view details</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
