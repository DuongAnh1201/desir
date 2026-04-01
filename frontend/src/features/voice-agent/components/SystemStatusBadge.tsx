import {AgentUIState} from '../types/voiceAgent.types';
import {voiceAgentStatusCopy, voiceAgentStatusTone} from '../utils/voiceAgentLayoutTokens';

export function SystemStatusBadge({uiState}: {uiState: AgentUIState}) {
  return (
    <div
      className="inline-flex items-center gap-3 rounded-sm border bg-[#1a1a1a] px-3.25 py-1.25"
      style={{borderColor: 'var(--voice-agent-border)'}}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{backgroundColor: voiceAgentStatusTone[uiState]}}
      />
      <span
        className="text-[10.3px] font-medium uppercase tracking-[1.1px] text-[#a3a3a3]"
        style={{fontFamily: 'var(--font-sans)'}}
      >
        {voiceAgentStatusCopy[uiState]}
      </span>
    </div>
  );
}
