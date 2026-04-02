import { VoiceAgentCapability } from '../types/voiceAgent.types';
import { VoiceAgentIcon } from './VoiceAgentIcons';

function capabilityDotColor(status: VoiceAgentCapability['status']) {
  switch (status) {
    case 'active':
      return 'var(--voice-agent-live-accent)';
    case 'degraded':
      return '#f59e0b';
    case 'offline':
      return '#737373';
    default:
      return '#22c55e';
  }
}

function connectionTextColor(status: VoiceAgentCapability['status']) {
  switch (status) {
    case 'active':
      return 'var(--voice-agent-live-accent)';
    case 'degraded':
      return '#f59e0b';
    case 'offline':
      return '#737373';
    default:
      return '#22c55e';
  }
}

export function CapabilityCard({
  capability,
  isSelected = false,
  onClick,
}: {
  capability: VoiceAgentCapability;
  isSelected?: boolean;
  onClick?: () => void;
}) {
  const isInteractive = Boolean(onClick);

  return (
    <button
      type="button"
      disabled={!isInteractive}
      onClick={onClick}
      className={`w-full rounded-sm border bg-[#111111] p-4.25 text-left transition ${
        isInteractive
          ? 'cursor-pointer hover:border-[var(--voice-agent-live-accent)] hover:bg-[#171717]'
          : 'cursor-default'
      }`}
      style={{
        borderColor: isSelected ? 'var(--voice-agent-live-accent)' : 'var(--voice-agent-border)',
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <VoiceAgentIcon name={capability.icon} className="h-4 w-4 text-white" />
          <div className="flex items-center gap-2">
            <span className="text-[13.3px] font-medium text-white">{capability.title}</span>
            {capability.statusLabel ? (
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-[1px] text-[#a3a3a3]">
                {capability.statusLabel}
              </span>
            ) : null}
          </div>
        </div>
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: capabilityDotColor(capability.status) }}
        />
      </div>

      <div className="mt-3">
        <div className="text-[9.2px] uppercase text-[#737373]">{capability.metricLabel}</div>
        <div className="mt-1 text-[11px] text-[#d4d4d4]">{capability.metricValue}</div>
        {isInteractive ? (
          <div className="mt-2 text-[9px] uppercase tracking-[1px] text-[#737373]">
            Click to view activity
          </div>
        ) : null}
      </div>

      <div
        className="mt-3 flex items-center justify-between border-t pt-2.25"
        style={{ borderColor: 'var(--voice-agent-border)' }}
      >
        <div className="text-[9.5px] uppercase text-[#737373]">Connection</div>
        <div
          className="text-[9.5px]"
          style={{ color: connectionTextColor(capability.status) }}
        >
          {capability.connectionLabel}
        </div>
      </div>
    </button>
  );
}
