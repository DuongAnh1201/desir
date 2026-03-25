import {AgentUIState} from '../types/voiceAgent.types';

export const voiceAgentLayoutTokens = {
  headerHeight: 56,
  footerHeight: 96,
  panelWidth: 320,
  outerPadding: 24,
  timelinePadding: 32,
  cardPadding: 17,
  borderRadius: 4,
  orbSize: 240,
  colors: {
    shell: '#0a0a0a',
    centerShell: '#0d0d0d',
    panel: '#111111',
    panelRaised: '#1a1a1a',
    border: '#262626',
    text: '#ffffff',
    mutedText: '#a3a3a3',
    dimText: '#737373',
    subtleText: '#525252',
    accent: '#0000ee',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
  },
} as const;

export const voiceAgentStatusCopy: Record<AgentUIState, string> = {
  idle: 'SYSTEM: READY',
  listening: 'SYSTEM: LISTENING',
  processing: 'SYSTEM: PROCESSING',
  executing: 'SYSTEM: EXECUTING',
  waiting_approval: 'SYSTEM: APPROVAL REQUIRED',
  completed: 'SYSTEM: COMPLETED',
  error: 'SYSTEM: ERROR',
};

export const voiceAgentMicCopy: Record<AgentUIState, string> = {
  idle: 'READY',
  listening: 'LISTENING',
  processing: 'PROCESSING',
  executing: 'EXECUTING',
  waiting_approval: 'PENDING',
  completed: 'COMPLETE',
  error: 'ERROR',
};

export const voiceAgentStatusTone: Record<AgentUIState, string> = {
  idle: '#525252',
  listening: 'var(--voice-agent-live-accent)',
  processing: 'var(--voice-agent-live-accent)',
  executing: 'var(--voice-agent-live-accent)',
  waiting_approval: '#f59e0b',
  completed: '#22c55e',
  error: '#ef4444',
};
