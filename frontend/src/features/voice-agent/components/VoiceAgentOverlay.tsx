import { CSSProperties } from 'react';
import {
  ApprovalRequest,
  AgentUIState,
  EmailDraftLifecycleStatus,
  TimelineStep,
  VoiceAgentCapability,
} from '../types/voiceAgent.types';
import { CapabilityPanel } from './CapabilityPanel';
import { ConversationPanel } from './ConversationPanel';
import { ExecutionTimeline } from './ExecutionTimeline';
import { VoiceAgentHeader } from './VoiceAgentHeader';
import { VoiceCommandBar } from './VoiceCommandBar';

export function VoiceAgentOverlay({
  uiState,
  transcriptPreview,
  timelineSteps,
  approvalRequest,
  latestEmailDraft,
  latestEmailDraftStatus,
  capabilities,
  jobId,
  hintText,
  selectedCapabilityId,
  accentColor,
  onOrbClick,
  onToggleCapabilityDetail,
}: {
  uiState: AgentUIState;
  transcriptPreview: string;
  timelineSteps: TimelineStep[];
  approvalRequest: ApprovalRequest | null;
  latestEmailDraft: ApprovalRequest | null;
  latestEmailDraftStatus: EmailDraftLifecycleStatus | null;
  capabilities: VoiceAgentCapability[];
  jobId: string;
  hintText: string;
  selectedCapabilityId: string | null;
  accentColor: string;
  onOrbClick: () => void;
  onToggleCapabilityDetail: (capabilityId: string) => void;
}) {
  return (
    <div
      className="min-h-screen overflow-hidden bg-(--voice-agent-shell) text-white"
      style={
        {
          ['--voice-agent-live-accent' as string]: accentColor,
        } as CSSProperties
      }
    >
      <div className="flex min-h-screen flex-col">
        <VoiceAgentHeader uiState={uiState} />

        <main
          className="grid flex-1"
          style={{
            gridTemplateColumns: 'minmax(0, 1fr)',
          }}
        >
          <div className="grid min-h-0 grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
            <ConversationPanel uiState={uiState} hintText={hintText} onOrbClick={onOrbClick} />
            <ExecutionTimeline
              jobId={jobId}
              steps={timelineSteps}
              approvalRequest={approvalRequest}
            />
            <CapabilityPanel
              capabilities={capabilities}
              selectedCapabilityId={selectedCapabilityId}
              latestEmailDraft={latestEmailDraft}
              latestEmailDraftStatus={latestEmailDraftStatus}
              onToggleCapability={onToggleCapabilityDetail}
            />
          </div>
        </main>

        <VoiceCommandBar uiState={uiState} transcriptPreview={transcriptPreview} onMicClick={onOrbClick} />
      </div>
    </div>
  );
}
