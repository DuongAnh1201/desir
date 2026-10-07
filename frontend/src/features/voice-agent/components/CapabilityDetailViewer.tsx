import {
  ApprovalRequest,
  EmailDraftLifecycleStatus,
  VoiceAgentCapability,
} from '../types/voiceAgent.types';
import {ApprovalCard} from './ApprovalCard';

export function CapabilityDetailViewer({
  capability,
  latestEmailDraft,
  latestEmailDraftStatus,
}: {
  capability: VoiceAgentCapability | null;
  latestEmailDraft: ApprovalRequest | null;
  latestEmailDraftStatus: EmailDraftLifecycleStatus | null;
}) {
  if (!capability) {
    return null;
  }

  if (capability.id === 'send_email' && latestEmailDraft && latestEmailDraftStatus) {
    return (
      <div className="border-t px-4 py-4" style={{borderColor: 'var(--voice-agent-border)'}}>
        <div className="mb-4 text-[10px] uppercase tracking-[1.2px] text-[#737373]">
          Activity Detail
        </div>
        <ApprovalCard request={latestEmailDraft} draftStatus={latestEmailDraftStatus} />
      </div>
    );
  }

  return (
    <div className="border-t px-4 py-4" style={{borderColor: 'var(--voice-agent-border)'}}>
      <div className="text-[10px] uppercase tracking-[1.2px] text-[#737373]">
        Activity Detail
      </div>
      <div
        className="mt-4 rounded-[10px] border bg-[#111111] p-4"
        style={{borderColor: 'var(--voice-agent-border)'}}
      >
        <div className="text-[16px] font-semibold text-white">{capability.title}</div>
        <div className="mt-2 text-[11px] text-[#737373]">
          Review the latest activity captured for this capability.
        </div>

        <div className="mt-5 grid gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[1px] text-[#737373]">
              Latest Activity
            </div>
            <div className="mt-2 text-[12px] text-white">{capability.metricValue}</div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-[1px] text-[#737373]">
              Connection
            </div>
            <div className="mt-2 text-[12px] text-white">{capability.connectionLabel}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
