import React from 'react';
import { Bell, Calendar, Search, MessageSquare, Phone, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export const ToolStatus: React.FC = () => {
  const tools = [
    { icon: MessageSquare, label: 'Email', active: true },
    { icon: Search, label: 'Web Search', active: true },
    { icon: Bell, label: 'iMessage', active: true },
    { icon: Phone, label: 'Calling', active: true },
    { icon: Calendar, label: 'Contacts', active: true },
    { icon: Sparkles, label: 'Daily Tasks', active: true },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-xl mt-12">
      {tools.map((tool, i) => (
        <motion.div 
          key={tool.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="relative group overflow-hidden"
        >
          <div className="flex items-center gap-4 p-4 glass-panel rounded-lg border border-muse-cyan/10 transition-all hover:border-muse-cyan/40 hover:bg-muse-cyan/5">
            <div className="relative">
              <tool.icon className={`w-6 h-6 ${tool.active ? 'text-muse-cyan' : 'text-zinc-600'} muse-glow`} />
              {tool.active && (
                <motion.div 
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-muse-cyan/20 rounded-full blur-sm"
                />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.2em] font-display text-muse-cyan/60">{tool.label}</span>
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">System Online</span>
            </div>
          </div>
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-muse-cyan/30" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-muse-cyan/30" />
        </motion.div>
      ))}
    </div>
  );
};
