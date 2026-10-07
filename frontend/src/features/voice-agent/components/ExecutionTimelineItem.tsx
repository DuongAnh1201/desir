import {PropsWithChildren} from 'react';
import {TimelineStep} from '../types/voiceAgent.types';
import {VoiceAgentIcon} from './VoiceAgentIcons';

function statusCardClassName(status: TimelineStep['status']) {
  switch (status) {
    case 'active':
      return 'border-[#e5e7eb] bg-[#1a1a1a]';
    case 'completed':
      return 'border-[var(--voice-agent-border)] bg-[#1a1a1a]';
    case 'waiting_approval':
      return 'border-[var(--voice-agent-border)] bg-[#141414] opacity-50';
    case 'blocked':
      return 'border-[var(--voice-agent-border)] bg-[#141414] opacity-45';
    case 'error':
      return 'border-[#ef4444] bg-[#1a1010]';
    default:
      return 'border-[var(--voice-agent-border)] bg-[#141414] opacity-50';
  }
}

function statusBadgeClassName(status: TimelineStep['status']) {
  switch (status) {
    case 'active':
      return 'bg-[var(--voice-agent-live-accent)] text-white';
    case 'completed':
      return 'bg-[#262626] text-[#a3a3a3]';
    case 'error':
      return 'bg-[#ef4444] text-white';
    default:
      return 'bg-[#171717] text-[#737373]';
  }
}

function statusIconClassName(status: TimelineStep['status']) {
  switch (status) {
    case 'error':
      return 'border-[#ef4444] text-[#ef4444]';
    case 'waiting_approval':
    case 'blocked':
      return 'border-[#404040] text-[#737373]';
    default:
      return 'border-[#e5e7eb] text-white';
  }
}

export function ExecutionTimelineItem({
  step,
  children,
}: PropsWithChildren<{step: TimelineStep}>) {
  return (
    <div className="w-full">
      <div className="flex w-full items-start gap-6">
        <div
          className={`relative z-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-black ${statusIconClassName(step.status)}`}
        >
          <VoiceAgentIcon name={step.icon} className="h-4 w-4" />
        </div>

        <div
          className={`min-w-0 flex-1 rounded-sm border p-4.25 ${statusCardClassName(step.status)}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 text-[13.4px] font-semibold text-white">{step.title}</div>
            <div
              className={`shrink-0 rounded-sm px-2 py-0.5 text-[9.7px] font-bold uppercase leading-3.75 ${statusBadgeClassName(step.status)}`}
            >
              {step.badgeLabel}
            </div>
          </div>
          <div
            className={`mt-1 text-[11px] ${
              step.status === 'active'
                ? 'text-[#a3a3a3]'
                : step.status === 'error'
                  ? 'text-[#fca5a5]'
                  : 'text-[#737373]'
            }`}
          >
            {step.subtitle}
          </div>
        </div>
      </div>

      {children ? <div className="ml-16 mt-4">{children}</div> : null}
    </div>
  );
}
