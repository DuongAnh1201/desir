import {VoiceAgentCapability} from '../types/voiceAgent.types';
import {CapabilityCard} from './CapabilityCard';

export function CapabilityPanel({capabilities}: {capabilities: VoiceAgentCapability[]}) {
  return (
    <section
      className="flex min-h-[280px] flex-col border-t xl:border-l xl:border-t-0"
      style={{borderColor: 'var(--voice-agent-border)'}}
    >
      <div
        className="border-b px-4 pb-[17px] pt-4"
        style={{borderColor: 'var(--voice-agent-border)'}}
      >
        <span className="text-[10.3px] font-medium uppercase tracking-[1.1px] text-[#737373]">
          System Capabilities
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-auto bg-black p-4">
        {capabilities.length === 0 ? (
          <div
            className="flex flex-1 items-center justify-center rounded-[4px] border border-dashed px-4 text-center text-[11px] text-[#737373]"
            style={{borderColor: 'var(--voice-agent-border)'}}
          >
            Completed tools will appear here after a task finishes.
          </div>
        ) : (
          capabilities.map((capability) => (
            <CapabilityCard key={capability.id} capability={capability} />
          ))
        )}
      </div>
    </section>
  );
}
