import {AgentUIState} from '../types/voiceAgent.types';
import {VoiceAgentOrb} from './VoiceAgentOrb';

export function ConversationPanel({
  uiState,
  hintText,
  onOrbClick,
}: {
  uiState: AgentUIState;
  hintText: string;
  onOrbClick: () => void;
}) {
  return (
    <section
      className="flex min-h-[320px] flex-col border-b xl:border-b-0 xl:border-r"
      style={{borderColor: 'var(--voice-agent-border)'}}
    >
      <div
        className="border-b px-4 pb-[17px] pt-4"
        style={{borderColor: 'var(--voice-agent-border)'}}
      >
        <span
          className="text-[10.8px] font-medium uppercase tracking-[1.1px] text-[#737373]"
          style={{fontFamily: 'var(--font-sans)'}}
        >
          Conversation Feed
        </span>
      </div>

      <div className="relative flex flex-1 items-center justify-center bg-[#0c0c0c] px-4 py-10 xl:min-h-0">
        <VoiceAgentOrb uiState={uiState} onClick={onOrbClick} />
        <div
          className="absolute bottom-8 left-0 right-0 px-6 text-center text-[11px] uppercase tracking-[1.1px] text-[#525252]"
          style={{fontFamily: 'var(--font-voice-agent-mono)'}}
        >
          {uiState === 'listening' || uiState === 'processing' || uiState === 'executing'
            ? 'Visualizing intent...'
            : hintText}
        </div>
      </div>
    </section>
  );
}
