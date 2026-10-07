import { motion } from 'motion/react';
import { AgentUIState } from '../types/voiceAgent.types';
import { voiceAgentLayoutTokens } from '../utils/voiceAgentLayoutTokens';

const orbBackground =
  'radial-gradient(circle at 35% 28%, rgba(122,122,255,0.95) 0%, rgba(61,61,255,0.92) 32%, rgba(31,31,247,0.95) 58%, rgba(8,8,240,0.98) 82%, rgba(0,0,238,1) 100%)';

function getGlowAnimation(uiState: AgentUIState) {
  switch (uiState) {
    case 'listening':
      return {
        scale: [0.92, 1.06, 0.92],
        opacity: [0.5, 0.95, 0.5],
      };
    case 'processing':
      return {
        scale: [0.94, 1.02, 0.94],
        opacity: [0.45, 0.75, 0.45],
      };
    case 'completed':
      return {
        scale: [0.95, 1.01, 0.95],
        opacity: [0.35, 0.55, 0.35],
      };
    case 'error':
      return {
        scale: [0.9, 0.97, 0.9],
        opacity: [0.15, 0.35, 0.15],
      };
    case 'waiting_approval':
      return { scale: 0.94, opacity: 0.32 };
    default:
      return {
        scale: [0.92, 0.98, 0.92],
        opacity: [0.3, 0.5, 0.3],
      };
  }
}

function getOrbAnimation(uiState: AgentUIState) {
  switch (uiState) {
    case 'listening':
      return { scale: [1, 1.05, 1], rotate: [0, 1.5, 0] };
    case 'processing':
      return { scale: [1, 1.02, 1], y: [0, -2, 0] };
    case 'completed':
      return { scale: [1, 1.01, 1], y: [0, -1, 0] };
    case 'error':
      return { scale: [1, 0.985, 1], opacity: [0.78, 0.92, 0.78] };
    case 'waiting_approval':
      return { scale: 0.985, opacity: 0.92 };
    default:
      return { scale: [1, 1.01, 1] };
  }
}

export function VoiceAgentOrb({
  uiState,
  onClick,
}: {
  uiState: AgentUIState;
  onClick: () => void;
}) {
  const orbSize = voiceAgentLayoutTokens.orbSize;
  const glowAnimation = getGlowAnimation(uiState);
  const orbAnimation = getOrbAnimation(uiState);
  const isStatic = uiState === 'waiting_approval';

  return (
    <button
      type="button"
      aria-label={uiState === 'idle' ? 'Start voice session' : 'Toggle voice session'}
      onClick={onClick}
      className="relative inline-flex items-center justify-center"
    >
      <motion.div
        className="absolute rounded-full blur-[32px]"
        animate={glowAnimation}
        transition={{
          repeat: isStatic ? 0 : Infinity,
          duration: uiState === 'listening' ? 1.8 : 2.8,
          ease: 'easeInOut',
        }}
        style={{
          width: orbSize + 16,
          height: orbSize + 16,
          backgroundColor:
            uiState === 'error'
              ? 'rgba(239, 68, 68, 0.35)'
              : 'color-mix(in srgb, var(--voice-agent-live-accent) 75%, transparent)',
        }}
      />

      <motion.div
        className="relative overflow-hidden rounded-full"
        animate={orbAnimation}
        transition={{
          repeat: isStatic ? 0 : Infinity,
          duration: uiState === 'listening' ? 1.9 : 3.2,
          ease: 'easeInOut',
        }}
        style={{
          width: orbSize,
          height: orbSize,
          backgroundImage: orbBackground,
          boxShadow:
            uiState === 'error'
              ? '0 0 40px rgba(239, 68, 68, 0.15)'
              : '0 0 60px color-mix(in srgb, var(--voice-agent-live-accent) 68%, transparent)',
          filter: uiState === 'error' ? 'saturate(0.35) grayscale(0.15)' : 'none',
        }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'radial-gradient(circle at 42% 24%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 54%)',
          }}
        />
        <div
          className="absolute inset-[15%] rounded-full blur-xs"
          style={{
            background:
              'radial-gradient(circle at 65% 65%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 68%)',
          }}
        />
        <div className="absolute inset-0 rounded-full shadow-[inset_0_0_25px_rgba(255,255,255,0.1)]" />
      </motion.div>
    </button>
  );
}
