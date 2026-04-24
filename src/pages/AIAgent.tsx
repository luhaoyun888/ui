import React from 'react';
import { 
  Bot, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Shield, 
  Zap,
  User,
  MoreHorizontal,
  Paperclip,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const approvals = [
  { id: 1, action: 'Execute Plugin', target: 'Slack Notifier', reason: 'Workflow #42 triggered notification', time: '5 mins ago' },
  { id: 2, action: 'Modify Policy', target: 'Data Transformer', reason: 'Requested "network" permission', time: '12 mins ago' },
];

const messages = [
  { id: 1, role: 'agent', content: 'Hello! I am your PluginOS Agent. I can help you manage plugins, monitor health, or execute complex workflows. How can I assist you today?', time: '10:00 AM' },
  { id: 2, role: 'user', content: 'Check the health of the Edge Gateway and let me know if there are any issues.', time: '10:01 AM' },
  { id: 3, role: 'agent', content: 'The Edge Gateway is currently showing a "Warning" status with high latency (250ms). This seems to be related to a network congestion in the us-east-1 region. Would you like me to attempt a service restart or notify the on-call engineer?', time: '10:01 AM' },
];

export default function AIAgent() {
  const [input, setInput] = React.useState('');
  const [chatMessages, setChatMessages] = React.useState(messages);
  const [pendingApprovals, setPendingApprovals] = React.useState(approvals);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newUserMsg = {
      id: chatMessages.length + 1,
      role: 'user' as const,
      content: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages([...chatMessages, newUserMsg]);
    setInput('');

    // Simulate agent response
    setTimeout(() => {
      const agentMsg = {
        id: chatMessages.length + 2,
        role: 'agent' as const,
        content: `I've received your request: "${input}". I'm processing that now across your edge nodes.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, agentMsg]);
    }, 1000);
  };

  const handleApproval = (id: number, action: 'approve' | 'reject') => {
    setPendingApprovals(prev => prev.filter(a => a.id !== id));
    
    const statusMsg = {
      id: chatMessages.length + 10,
      role: 'agent' as const,
      content: `Action ${action === 'approve' ? 'APPROVED' : 'REJECTED'} for ${approvals.find(a => a.id === id)?.target}.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, statusMsg]);
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col lg:flex-row gap-8">
      {/* Chat Interface */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">PluginOS Assistant</h2>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-xs text-slate-400 font-medium">Online & Ready</span>
              </div>
            </div>
          </div>
          <button className="p-2 text-slate-400 hover:bg-white hover:text-slate-600 rounded-xl transition-all border border-transparent hover:border-slate-200">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-8 space-y-8">
          {chatMessages.map((msg) => (
            <motion.div 
              key={msg.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-4 max-w-[85%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                msg.role === 'agent' ? "bg-indigo-50 text-indigo-600" : "bg-slate-900 text-white"
              )}>
                {msg.role === 'agent' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <div className="space-y-1.5">
                <div className={cn(
                  "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                  msg.role === 'agent' ? "bg-slate-50 text-slate-700 border border-slate-100" : "bg-indigo-600 text-white"
                )}>
                  {msg.content}
                </div>
                <p className={cn("text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1", msg.role === 'user' && "text-right")}>
                  {msg.time}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="p-6 bg-slate-50/50 border-t border-slate-100">
          <form 
            onSubmit={handleSend}
            className="bg-white border border-slate-200 rounded-2xl p-2 flex items-center gap-2 shadow-sm focus-within:border-indigo-500 transition-all"
          >
            <button type="button" className="p-3 text-slate-400 hover:text-indigo-600 transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the agent to do something..." 
              className="flex-1 py-3 outline-none text-sm text-slate-600"
            />
            <button 
              type="submit"
              className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Check Health', 'List Plugins', 'Deploy Version'].map(tag => (
              <button 
                key={tag} 
                onClick={() => setInput(tag)}
                className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-full border border-slate-200 transition-all uppercase tracking-widest"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Approvals Sidebar */}
      <div className="w-full lg:w-96 space-y-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-amber-50/30">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-600" />
              Pending Approvals
            </h2>
            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full">
              {pendingApprovals.length} Actions
            </span>
          </div>
          <div className="p-6 space-y-6">
            <AnimatePresence mode="popLayout">
              {pendingApprovals.map((app) => (
                <motion.div 
                  key={app.id} 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-amber-200 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{app.action}</p>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {app.time}
                      </span>
                    </div>
                    <p className="font-bold text-slate-800 text-lg">{app.target}</p>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed italic">"{app.reason}"</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleApproval(app.id, 'approve')}
                      className="flex-1 bg-white border border-slate-200 text-emerald-600 font-bold py-2 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve
                    </button>
                    <button 
                      onClick={() => handleApproval(app.id, 'reject')}
                      className="flex-1 bg-white border border-slate-200 text-rose-600 font-bold py-2 rounded-xl hover:bg-rose-50 hover:border-rose-200 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {pendingApprovals.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-emerald-200 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-400">All actions cleared</p>
              </div>
            )}
          </div>
          <button className="p-4 text-xs font-bold text-slate-400 hover:text-slate-600 border-t border-slate-100 transition-colors uppercase tracking-widest">
            View Approval History
          </button>
        </div>

        <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Sparkles className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-300" />
            Capabilities
          </h3>
          <ul className="space-y-4">
            {[
              'Autonomous health remediation',
              'Plugin lifecycle automation',
              'Multi-step workflow execution',
              'Security policy enforcement'
            ].map((cap, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-indigo-100 group-hover:translate-x-1 transition-transform">
                <ChevronRight className="w-4 h-4 mt-0.5 text-indigo-300" />
                {cap}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
