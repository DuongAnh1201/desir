import { CSSProperties } from 'react';
import {
  ApprovalRequest,
  AgentUIState,
  EmailDraftLifecycleStatus,
  TimelineStep,
  VoiceAgentCapability,
} from '../types/voiceAgent.types';
import {CapabilityDetailViewer} from './CapabilityDetailViewer';
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
  editStubMessage,
  selectedCapabilityId,
  isCapabilityViewerOpen,
  accentColor,
  onOrbClick,
  onApprove,
  onCancel,
  onOpenCapabilityDetail,
  onCloseCapabilityDetail,
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
  editStubMessage: string | null;
  selectedCapabilityId: string | null;
  isCapabilityViewerOpen: boolean;
  accentColor: string;
  onOrbClick: () => void;
  onApprove: (draft?: NonNullable<ApprovalRequest['preview']>) => void;
  onCancel: () => void;
  onOpenCapabilityDetail: (capabilityId: string) => void;
  onCloseCapabilityDetail: () => void;
}) {
  const shouldShowCapabilityViewer =
    isCapabilityViewerOpen &&
    selectedCapabilityId === 'send_email' &&
    Boolean(latestEmailDraft) &&
    Boolean(latestEmailDraftStatus);

  return (
    <div
      className="min-h-screen overflow-hidden bg-(--voice-agent-shell) text-white"
      style={
        {
          ['--voice-agent-live-accent' as string]: accentColor,
        } as CSSProperties
      }
    >
      {shouldShowCapabilityViewer ? (
        <CapabilityDetailViewer
          request={latestEmailDraft}
          draftStatus={latestEmailDraftStatus}
          editStubMessage={editStubMessage}
          onApprove={onApprove}
          onCancel={onCancel}
          onClose={onCloseCapabilityDetail}
        />
      ) : null}

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
              editStubMessage={editStubMessage}
              onApprove={onApprove}
              onCancel={onCancel}
            />
            <CapabilityPanel
              capabilities={capabilities}
              selectedCapabilityId={selectedCapabilityId}
              onSelectCapability={onOpenCapabilityDetail}
            />
          </div>
        </main>

        <VoiceCommandBar uiState={uiState} transcriptPreview={transcriptPreview} onMicClick={onOrbClick} />
      </div>
    </div>
  );
}
