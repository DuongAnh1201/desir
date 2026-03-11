import React, { useState, useEffect, useRef } from 'react';
import { RobotFace } from './component/RobotFace';
import { ToolStatus } from './component/ToolStatus';
import { AssistantState, INITIAL_STATE } from './types';
import { AudioRecorder, AudioStreamer } from './service/audioService';
import { Power, Settings, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const WS_URL = 'ws://localhost:8765';

export default function App() {
  const [state, setState] = useState<AssistantState>(INITIAL_STATE);
  const [isPowerOn, setIsPowerOn] = useState(false);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', state.themeColor);
  }, [state.themeColor]);

  const togglePower = () => {
    if (isPowerOn) {
      stopAssistant();
      setIsPowerOn(false);
    } else {
      startAssistant();
    }
  };

  const startAssistant = async () => {
    setState(prev => ({ ...prev, error: null }));

    // Init audio (must be triggered by user gesture)
    try {
      audioStreamerRef.current = new AudioStreamer();
      audioRecorderRef.current = new AudioRecorder((base64) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'audio', data: base64 }));
        }
      });
      await audioRecorderRef.current.start();
    } catch (err: any) {
      let errorMessage = 'Microphone access denied.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = "Microphone access is blocked. Please allow microphone access in your browser and refresh.";
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No microphone detected. Please connect a microphone and try again.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Microphone not supported. Please use Chrome or Edge over HTTPS.';
      }
      setState(prev => ({ ...prev, emotion: 'sadness', error: errorMessage }));
      return;
    }

    // Connect to Desir backend server
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsPowerOn(true);
      setState(prev => ({ ...prev, emotion: 'happy', error: null }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === 'audio') {
        audioStreamerRef.current?.playChunk(msg.data);
        setState(prev => ({ ...prev, isSpeaking: true }));
      } else if (msg.type === 'state') {
        setState(prev => ({ ...prev, isSpeaking: msg.speaking }));
      } else if (msg.type === 'transcript') {
        // Detect emotion from Desir's response text
        if (msg.role === 'assistant') {
          const text = msg.text.toLowerCase();
          if (text.match(/happy|glad|delighted|pleasure|excellent|wonderful|perfect|happiness/)) {
            setState(prev => ({ ...prev, emotion: 'happiness' }));
          } else if (text.match(/humble|honored|respectful|serve|privilege/)) {
            setState(prev => ({ ...prev, emotion: 'humble' }));
          } else if (text.match(/smile|joke|witty|funny|haha/)) {
            setState(prev => ({ ...prev, emotion: 'smile' }));
          } else if (text.match(/sorry|sad|apologize|unfortunately|afraid|regret/)) {
            setState(prev => ({ ...prev, emotion: 'sadness' }));
          } else if (text.match(/confused|puzzled|unsure|unclear|pardon/)) {
            setState(prev => ({ ...prev, emotion: 'confused' }));
          } else if (text.match(/thinking|processing|searching|analyzing|working/)) {
            setState(prev => ({ ...prev, emotion: 'thinking' }));
          }
        }
      } else if (msg.type === 'tool_call') {
        handleFrontendTool(msg.call_id, msg.name, msg.args, ws);
      } else if (msg.type === 'error') {
        setState(prev => ({ ...prev, emotion: 'sadness', error: msg.message }));
      }
    };

    ws.onclose = () => {
      stopAssistant();
    };

    ws.onerror = () => {
      setState(prev => ({
        ...prev,
        emotion: 'sadness',
        error: 'Cannot connect to Desir server. Run: uv run python server.py',
      }));
      stopAssistant();
    };
  };

  const handleFrontendTool = (call_id: string, name: string, args: any, ws: WebSocket) => {
    let result = 'done';
    if (name === 'changeThemeColor') {
      setState(prev => ({ ...prev, themeColor: args.color }));
      result = `Theme color updated to ${args.color}`;
    } else if (name === 'update_daily_tasks') {
      setState(prev => ({ ...prev, tasks: args.tasks as string[] }));
      result = 'Tasks updated.';
    }
    ws.send(JSON.stringify({ type: 'tool_result', call_id, result }));
  };

  const stopAssistant = () => {
    audioRecorderRef.current?.stop();
    audioStreamerRef.current?.stop();
    wsRef.current?.close();
    wsRef.current = null;
    setIsPowerOn(false);
    setState(INITIAL_STATE);
  };

  return (
    <div className="min-h-screen bg-muse-bg text-white font-sans selection:bg-muse-cyan/30 overflow-hidden relative">
      {/* Background HUD Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0, 242, 255, 0.1) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
        <div className="scanline" />
      </div>

      {/* Corner HUD Elements */}
      <div className="fixed top-32 left-8 pointer-events-none z-20">
        <div className="flex flex-col gap-1">
          <div className="w-24 h-0.5 bg-muse-cyan/40" />
          <div className="text-[9px] font-mono text-muse-cyan/60 tracking-[0.3em] uppercase">System Diagnosis</div>
          <div className="flex gap-1.5 mt-1">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                className="w-3 h-0.5 bg-muse-cyan/60"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="fixed top-32 right-8 pointer-events-none z-20 text-right">
        <div className="flex flex-col items-end gap-1">
          <div className="w-24 h-0.5 bg-muse-cyan/40" />
          <div className="text-[9px] font-mono text-muse-cyan/60 tracking-[0.3em] uppercase">Neural Interface</div>
          <div className="text-[8px] font-mono text-zinc-500 mt-1 uppercase tracking-widest">
            Link Status: {isPowerOn ? 'SECURE' : 'OFFLINE'}
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-30 flex items-center justify-between p-8">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${isPowerOn ? 'border-muse-cyan shadow-[0_0_20px_rgba(0,242,255,0.4)]' : 'border-zinc-800'}`}>
            <Power className={`w-6 h-6 ${isPowerOn ? 'text-muse-cyan' : 'text-zinc-700'}`} />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-[0.1em] text-muse-cyan muse-glow">Désir</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-[0.4em] font-mono">
              Dispositif Électronique de Surveillance et d'Intervention Rapide
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button className="flex items-center gap-2 text-zinc-400 hover:text-muse-cyan transition-all group">
            <span className="text-[10px] font-mono uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Settings</span>
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="relative z-10 flex flex-col items-center justify-center pt-12 px-8 pb-32">
        {/* Arc Reactor / Robot Face */}
        <div className="relative mb-16">
          <AnimatePresence mode="wait">
            {isPowerOn ? (
              <motion.div
                key="face"
                initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.5, opacity: 0, rotate: 45 }}
                transition={{ type: 'spring', damping: 15 }}
              >
                <RobotFace emotion={state.emotion} isSpeaking={state.isSpeaking} themeColor={state.themeColor} />
              </motion.div>
            ) : (
              <motion.div
                key="offline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={togglePower}
                className="w-80 h-80 rounded-full border-2 border-zinc-900 flex items-center justify-center cursor-pointer group hover:border-muse-cyan/30 transition-colors"
              >
                <div className="flex flex-col items-center gap-4">
                  <Power className="w-12 h-12 text-zinc-800 group-hover:text-muse-cyan/50 transition-colors" />
                  <span className="text-[10px] font-mono text-zinc-700 uppercase tracking-[0.5em]">Initiate Core</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Status + Controls */}
        <div className="flex flex-col items-center gap-12 w-full max-w-4xl">
          <div className="text-center">
            <motion.h2
              animate={isPowerOn ? { opacity: [0.5, 1, 0.5] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
              className={`text-3xl font-display font-medium mb-4 tracking-widest ${state.error ? 'text-red-400' : 'text-muse-cyan muse-glow'}`}
            >
              {state.error
                ? 'INTERFACE ERROR'
                : isPowerOn
                  ? state.isSpeaking ? 'TRANSMITTING' : 'AWAITING INPUT'
                  : 'CORE OFFLINE'}
            </motion.h2>
            <div className="max-w-md mx-auto">
              <p className={`text-xs font-mono uppercase tracking-widest leading-relaxed ${state.error ? 'text-red-400/80' : 'text-zinc-500'}`}>
                {state.error
                  ? state.error
                  : isPowerOn
                    ? 'Neural pathways synchronized. Voice interface active. How may I assist you, Sir?'
                    : 'System in standby mode. Manual override required for core initialization.'}
              </p>
              {state.error && (
                <button
                  onClick={() => {
                    setState(prev => ({ ...prev, error: null }));
                    startAssistant();
                  }}
                  className="mt-4 px-4 py-2 border border-red-500/30 text-red-400 text-[10px] font-mono uppercase tracking-widest hover:bg-red-500/10 transition-colors"
                >
                  Retry Initialization
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-8">
            <button
              onClick={togglePower}
              className={`group relative p-8 rounded-full transition-all duration-700 ${
                isPowerOn
                  ? 'bg-red-500/5 border-red-500/30 text-red-500 shadow-[0_0_40px_rgba(239,68,68,0.1)]'
                  : 'bg-muse-cyan/5 border-muse-cyan/30 text-muse-cyan shadow-[0_0_40px_rgba(0,242,255,0.1)]'
              } border-2 overflow-hidden`}
            >
              <Power className="w-10 h-10 relative z-10" />
              <motion.div
                animate={isPowerOn ? { scale: [1, 1.5, 1], opacity: [0.1, 0.3, 0.1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-current opacity-0 group-hover:opacity-10 transition-opacity"
              />
            </button>
          </div>

          <ToolStatus />

          {/* Daily Tasks */}
          <AnimatePresence>
            {isPowerOn && state.tasks.length > 0 && (
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="w-full max-w-2xl mt-8 glass-panel rounded-xl border border-muse-cyan/20 p-8 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-muse-cyan" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-muse-cyan" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-muse-cyan" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-muse-cyan" />

                <div className="flex items-center justify-between mb-8 border-b border-muse-cyan/10 pb-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-muse-cyan muse-glow" />
                    <h3 className="text-sm font-display font-bold uppercase tracking-[0.3em] text-muse-cyan">Objective Protocol</h3>
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Priority: Alpha</div>
                </div>

                <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {state.tasks.map((task, i) => (
                    <motion.li
                      key={i}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-4 group cursor-pointer"
                    >
                      <div className="mt-1.5 w-2 h-2 border border-muse-cyan rotate-45 group-hover:bg-muse-cyan transition-all" />
                      <div className="flex flex-col">
                        <span className="text-xs font-mono text-zinc-300 group-hover:text-muse-cyan transition-colors uppercase tracking-wider">{task}</span>
                        <span className="text-[9px] font-mono text-zinc-600 uppercase mt-1">Status: Pending</span>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer HUD Rail */}
      <footer className="fixed bottom-0 left-0 right-0 p-8 flex justify-between items-center z-20 pointer-events-none">
        <div className="flex flex-col gap-2">
          <div className="flex gap-1">
            {[...Array(10)].map((_, i) => (
              <div key={i} className={`w-1 h-3 ${i < 7 ? 'bg-muse-cyan/40' : 'bg-zinc-800'}`} />
            ))}
          </div>
          <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.4em]">Processor Load: 42%</div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.4em]">Location: Paris, France</div>
          <div className="text-[10px] font-display font-bold text-muse-cyan/40 tracking-[0.2em]">LA MUSE INDUSTRY</div>
        </div>
      </footer>
    </div>
  );
}
