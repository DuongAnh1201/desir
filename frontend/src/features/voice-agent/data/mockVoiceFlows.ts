import {ApprovalRequest, VoiceAgentFlow} from '../types/voiceAgent.types';

const scheduleApprovalRequest: ApprovalRequest = {
  id: 'approval-schedule-john',
  title: 'Approval Required',
  summary: 'Create "Quick Sync with John" on Apple Calendar',
  detail: 'Permission required for write operation before creating the calendar event.',
  approveLabel: 'Approve',
  editLabel: 'Edit',
  cancelLabel: 'Cancel',
};

const scheduleQuickSyncFlow: VoiceAgentFlow = {
  id: 'schedule-quick-sync',
  capabilityId: 'calendar',
  matcher: [/\bschedule\b/i, /\bquick sync\b/i, /\bcalendar\b/i, /\bmeeting\b/i],
  approvalRequest: scheduleApprovalRequest,
  steps: [
    {
      id: 'listen-intent',
      title: 'Listening to user intent',
      subtitle: 'VAD: ACTIVE | AUDIO_CH: 01',
      icon: 'mic',
      phase: 'listening',
      autoAdvanceMs: 900,
    },
    {
      id: 'understand-intent',
      title: 'Understanding Intent',
      subtitle: 'Model: Realtime-V2-Orchestrator',
      icon: 'brain',
      phase: 'processing',
      autoAdvanceMs: 900,
    },
    {
      id: 'resolve-contact',
      title: 'Resolving Contact',
      subtitle: 'Contact lookup: John',
      icon: 'contact',
      phase: 'processing',
      autoAdvanceMs: 950,
    },
    {
      id: 'draft-calendar-invite',
      title: 'Drafting Calendar Invite',
      subtitle: 'Tool: Apple Calendar bridge',
      icon: 'calendar',
      phase: 'executing',
      autoAdvanceMs: 1150,
    },
    {
      id: 'waiting-approval',
      title: 'Waiting for Approval',
      subtitle: 'Permission required for write operation',
      icon: 'lock',
      phase: 'waiting_approval',
      waitForApproval: true,
    },
    {
      id: 'create-calendar-event',
      title: 'Creating Calendar Event',
      subtitle: 'Writing Quick Sync with John to Apple Calendar',
      icon: 'calendar',
      phase: 'executing',
      autoAdvanceMs: 1200,
    },
    {
      id: 'command-complete',
      title: 'Completed',
      subtitle: 'Quick Sync with John is ready.',
      icon: 'check',
      phase: 'completed',
      autoAdvanceMs: 850,
    },
  ],
};

const genericApprovalRequest: ApprovalRequest = {
  id: 'approval-generic',
  title: 'Approval Required',
  summary: 'Confirm the requested write action',
  detail: 'This workflow needs approval before mutating an external tool.',
  approveLabel: 'Approve',
  editLabel: 'Edit',
  cancelLabel: 'Cancel',
};

const genericFlow: VoiceAgentFlow = {
  id: 'generic-assistant-flow',
  capabilityId: 'email',
  matcher: [/.*/],
  approvalRequest: genericApprovalRequest,
  steps: [
    {
      id: 'generic-listen',
      title: 'Listening to user intent',
      subtitle: 'Realtime capture: active',
      icon: 'mic',
      phase: 'listening',
      autoAdvanceMs: 800,
    },
    {
      id: 'generic-understand',
      title: 'Understanding Intent',
      subtitle: 'Intent classifier: synced',
      icon: 'brain',
      phase: 'processing',
      autoAdvanceMs: 850,
    },
    {
      id: 'generic-prepare',
      title: 'Preparing Action Plan',
      subtitle: 'Synthesizing the next tool sequence',
      icon: 'spark',
      phase: 'executing',
      autoAdvanceMs: 1000,
    },
    {
      id: 'generic-await',
      title: 'Waiting for Approval',
      subtitle: 'Permission required for write operation',
      icon: 'lock',
      phase: 'waiting_approval',
      waitForApproval: true,
    },
    {
      id: 'generic-complete',
      title: 'Completed',
      subtitle: 'Execution plan confirmed.',
      icon: 'check',
      phase: 'completed',
      autoAdvanceMs: 700,
    },
  ],
};

export const mockVoiceFlows: VoiceAgentFlow[] = [scheduleQuickSyncFlow, genericFlow];

export function resolveMockVoiceFlow(transcript: string): VoiceAgentFlow {
  const normalizedTranscript = transcript.trim();
  return (
    mockVoiceFlows.find((flow) =>
      flow.matcher.some((pattern) => pattern.test(normalizedTranscript)),
    ) ??
    genericFlow
  );
}
