import {CSSProperties} from 'react';
import {ApprovalRequest, AgentUIState, TimelineStep, VoiceAgentCapability} from '../types/voiceAgent.types';
import {CapabilityPanel} from './CapabilityPanel';
import {ConversationPanel} from './ConversationPanel';
import {DailyTasksPanel} from './DailyTasksPanel';
import {ExecutionTimeline} from './ExecutionTimeline';
import {VoiceAgentHeader} from './VoiceAgentHeader';
import {VoiceCommandBar} from './VoiceCommandBar';

export function VoiceAgentOverlay({
  uiState,
  transcriptPreview,
  timelineSteps,
  approvalRequest,
  capabilities,
  tasks,
  jobId,
  hintText,
  editStubMessage,
  accentColor,
  onOrbClick,
  onApprove,
  onEdit,
  onCancel,
}: {
  uiState: AgentUIState;
  transcriptPreview: string;
  timelineSteps: TimelineStep[];
  approvalRequest: ApprovalRequest | null;
  capabilities: VoiceAgentCapability[];
  tasks: string[];
  jobId: string;
  hintText: string;
  editStubMessage: string | null;
  accentColor: string;
  onOrbClick: () => void;
  onApprove: () => void;
  onEdit: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="min-h-screen overflow-hidden bg-[var(--voice-agent-shell)] text-white"
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
              editStubMessage={editStubMessage}
              onApprove={onApprove}
              onEdit={onEdit}
              onCancel={onCancel}
            />
            <div className="flex min-h-[280px] flex-col border-t xl:border-l xl:border-t-0" style={{borderColor: 'var(--voice-agent-border)'}}>
              <CapabilityPanel capabilities={capabilities} />
              <DailyTasksPanel tasks={tasks} />
            </div>
          </div>
        </main>

        <VoiceCommandBar uiState={uiState} transcriptPreview={transcriptPreview} onMicClick={onOrbClick} />
      </div>
    </div>
  );
}
