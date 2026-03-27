import {AgentUIState} from '../types/voiceAgent.types';
import {voiceAgentLayoutTokens, voiceAgentMicCopy} from '../utils/voiceAgentLayoutTokens';
import {VoiceAgentIcon} from './VoiceAgentIcons';

function micButtonTone(uiState: AgentUIState) {
  switch (uiState) {
    case 'idle':
      return {
        backgroundColor: '#171717',
        color: '#737373',
      };
    case 'error':
      return {
        backgroundColor: '#2a1515',
        color: '#ef4444',
      };
    default:
      return {
        backgroundColor: 'var(--voice-agent-live-accent)',
        color: '#ffffff',
      };
  }
}

export function VoiceCommandBar({
  uiState,
  transcriptPreview,
  onMicClick,
}: {
  uiState: AgentUIState;
  transcriptPreview: string;
  onMicClick: () => void;
}) {
  const micTone = micButtonTone(uiState);

  return (
    <footer
      className="flex items-center justify-center border-t bg-[var(--voice-agent-shell)] px-6"
      style={{
        height: voiceAgentLayoutTokens.footerHeight,
        borderColor: 'var(--voice-agent-border)',
      }}
    >
      <div
        className="flex h-14 w-full items-center gap-4 rounded-full border bg-[#111111] px-[25px]"
        style={{borderColor: 'var(--voice-agent-border)'}}
      >
        <div className="w-[26px]" />
        <div className="min-w-0 flex-1 truncate text-[12.8px] italic text-[#a3a3a3]">
          {transcriptPreview}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className="text-[10px] uppercase tracking-[-0.5px] text-[#525252]"
            style={{fontFamily: 'var(--font-voice-agent-mono)'}}
          >
            {voiceAgentMicCopy[uiState]}
          </span>
          <button
            type="button"
            onClick={onMicClick}
            aria-label="Toggle voice session"
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={micTone}
          >
            <VoiceAgentIcon name="waveform" className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
