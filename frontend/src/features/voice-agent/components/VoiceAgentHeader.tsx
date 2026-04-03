import {AgentUIState} from '../types/voiceAgent.types';
import {voiceAgentLayoutTokens} from '../utils/voiceAgentLayoutTokens';
import {SystemStatusBadge} from './SystemStatusBadge';
import {VoiceAgentIcon} from './VoiceAgentIcons';

export function VoiceAgentHeader({uiState}: {uiState: AgentUIState}) {
  return (
    <header
      className="relative flex items-center justify-between border-b bg-[var(--voice-agent-shell)] px-6"
      style={{
        height: voiceAgentLayoutTokens.headerHeight,
        borderColor: 'var(--voice-agent-border)',
      }}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-[2px] bg-[var(--voice-agent-live-accent)] text-white">
          <VoiceAgentIcon name="desir" className="h-3.5 w-3.5" />
        </div>
        <span className="text-[17.6px] font-bold tracking-[-0.45px] text-white">DESIR</span>
      </div>

      <div className="absolute left-1/2 hidden -translate-x-1/2 md:flex">
        <SystemStatusBadge uiState={uiState} />
      </div>

      <div className="flex items-center gap-4 text-[#737373]">
        <div className="md:hidden">
          <SystemStatusBadge uiState={uiState} />
        </div>
        <button type="button" aria-label="Settings" className="transition-colors hover:text-white">
          <VoiceAgentIcon name="settings" className="h-[18px] w-[18px]" />
        </button>
        <button type="button" aria-label="Profile" className="transition-colors hover:text-white">
          <VoiceAgentIcon name="user" className="h-[18px] w-[18px]" />
        </button>
      </div>
    </header>
  );
}
