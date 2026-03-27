export type AgentUIState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'executing'
  | 'waiting_approval'
  | 'completed'
  | 'error';

export type TimelineStepStatus =
  | 'pending'
  | 'active'
  | 'completed'
  | 'waiting_approval'
  | 'blocked'
  | 'error';

export type CapabilityStatus = 'connected' | 'active' | 'degraded' | 'offline';

export type VoiceAgentIconName =
  | 'desir'
  | 'mail'
  | 'calendar'
  | 'slack'
  | 'settings'
  | 'user'
  | 'mic'
  | 'brain'
  | 'contact'
  | 'lock'
  | 'spark'
  | 'check'
  | 'x'
  | 'waveform';

export interface TimelineStep {
  id: string;
  title: string;
  subtitle: string;
  icon: VoiceAgentIconName;
  status: TimelineStepStatus;
  badgeLabel?: string;
}

export interface TimelineStepTemplate {
  id: string;
  title: string;
  subtitle: string;
  icon: VoiceAgentIconName;
  phase: AgentUIState;
  autoAdvanceMs?: number;
  waitForApproval?: boolean;
}

export interface VoiceAgentCapability {
  id: string;
  title: string;
  icon: VoiceAgentIconName;
  status: CapabilityStatus;
  metricLabel: string;
  metricValue: string;
  connectionLabel: string;
}

export interface ApprovalRequest {
  id: string;
  title: string;
  summary: string;
  detail: string;
  approveLabel: string;
  editLabel: string;
  cancelLabel: string;
}

export interface VoiceAgentCommand {
  id: string;
  rawText: string;
  normalizedText: string;
  flowId: string;
  targetCapabilityId: string;
  jobId: string;
}

export interface VoiceAgentFlow {
  id: string;
  capabilityId: string;
  matcher: RegExp[];
  steps: TimelineStepTemplate[];
  approvalRequest: ApprovalRequest | null;
}

export interface VoiceAgentViewModel {
  uiState: AgentUIState;
  transcriptPreview: string;
  timelineSteps: TimelineStep[];
  approvalRequest: ApprovalRequest | null;
  capabilities: VoiceAgentCapability[];
  command: VoiceAgentCommand | null;
  jobId: string;
  hintText: string;
  errorMessage: string | null;
  isSessionActive: boolean;
  editStubMessage: string | null;
}

export type AgentEventPayload =
  | { type: 'audio'; data: string }
  | { type: 'state'; speaking: boolean }
  | { type: 'transcript'; role: 'user' | 'assistant'; text: string }
  | { type: 'tool_call'; callId: string; name: string; args: unknown }
  | { type: 'error'; message: string }
  | {
      type: 'step_update';
      stepId: string;
      status: TimelineStepStatus;
      title?: string;
      subtitle?: string;
    }
  | { type: 'approval_requested'; request: ApprovalRequest }
  | {
      type: 'approval_resolved';
      requestId: string;
      decision: 'approved' | 'edited' | 'cancelled';
    }
  | { type: 'completed'; message?: string };
