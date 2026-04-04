import {useEffect, useMemo, useReducer} from 'react';
import {resolveMockVoiceFlow} from '../data/mockVoiceFlows';
import {
  ApprovalRequest,
  AgentEventPayload,
  CapabilityStatus,
  EmailDraftLifecycleStatus,
  TimelineStep,
  TimelineStepStatus,
  VoiceAgentCapability,
  VoiceAgentCommand,
  VoiceAgentFlow,
  VoiceAgentIconName,
  VoiceAgentViewModel,
} from '../types/voiceAgent.types';
import {
  approvalDecisionToDraftStatus,
  hasPendingApproval,
  shouldIgnoreCompletedState,
  shouldIgnoreSpeakingState,
  upsertEmailDraftCapability,
} from '../utils/approvalState.js';
import {upsertApprovalTimeline} from '../utils/approvalTimeline.js';

interface UseVoiceAgentUIStateOptions {
  capabilities?: VoiceAgentCapability[];
}

interface PendingToolCall {
  callId: string;
  name: string;
  args: unknown;
}

interface ToolCapabilityDescriptor {
  title: string;
  icon: VoiceAgentIconName;
  metricLabel: string;
}

interface VoiceAgentReducerState extends VoiceAgentViewModel {
  baseCapabilities: VoiceAgentCapability[];
  activeFlow: VoiceAgentFlow | null;
  activeStepIndex: number;
  pendingToolCalls: PendingToolCall[];
}

type VoiceAgentAction =
  | {type: 'BEGIN_LISTENING'}
  | {type: 'SESSION_CONNECTED'}
  | {type: 'SESSION_STOPPED'}
  | {type: 'INGEST_EVENT'; event: AgentEventPayload}
  | {type: 'ADVANCE_FLOW'}
  | {type: 'RESOLVE_APPROVAL'; decision: 'approved' | 'cancelled'}
  | {type: 'TOGGLE_CAPABILITY_DETAIL'; capabilityId: string};

const TOOL_CAPABILITY_DESCRIPTORS: Record<string, ToolCapabilityDescriptor> = {
  send_email: {
    title: 'Email',
    icon: 'mail',
    metricLabel: 'Last Usage',
  },
  schedule_event: {
    title: 'Calendar',
    icon: 'calendar',
    metricLabel: 'Last Usage',
  },
  search_web: {
    title: 'Web Search',
    icon: 'spark',
    metricLabel: 'Last Usage',
  },
  search_contact: {
    title: 'Contacts',
    icon: 'contact',
    metricLabel: 'Last Usage',
  },
  send_imessage: {
    title: 'Messages',
    icon: 'user',
    metricLabel: 'Last Usage',
  },
  make_call: {
    title: 'Calls',
    icon: 'waveform',
    metricLabel: 'Last Usage',
  },
  changeThemeColor: {
    title: 'Theme',
    icon: 'settings',
    metricLabel: 'Last Usage',
  },
  update_daily_tasks: {
    title: 'Tasks',
    icon: 'check',
    metricLabel: 'Last Usage',
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function cloneCapabilities(capabilities: VoiceAgentCapability[]): VoiceAgentCapability[] {
  return capabilities.map((capability) => ({...capability}));
}

function connectionLabelForStatus(status: CapabilityStatus): string {
  switch (status) {
    case 'active':
      return 'ACTIVE';
    case 'degraded':
      return 'DEGRADED';
    case 'offline':
      return 'OFFLINE';
    default:
      return 'CONNECTED';
  }
}

function setCapabilityStatus(
  capability: VoiceAgentCapability,
  status: CapabilityStatus,
): VoiceAgentCapability {
  return {
    ...capability,
    status,
    connectionLabel: connectionLabelForStatus(status),
  };
}

function createInitialState(
  capabilities: VoiceAgentCapability[],
): VoiceAgentReducerState {
  return {
    baseCapabilities: cloneCapabilities(capabilities),
    uiState: 'idle',
    transcriptPreview: '"Tap the orb to begin a voice session."',
    timelineSteps: [],
    approvalRequest: null,
    latestEmailDraft: null,
    latestEmailDraftStatus: null,
    capabilities: cloneCapabilities(capabilities),
    command: null,
    jobId: 'JOB_ID: -- ----',
    hintText: 'Awaiting command stream...',
    errorMessage: null,
    isSessionActive: false,
    selectedCapabilityId: null,
    activeFlow: null,
    activeStepIndex: -1,
    pendingToolCalls: [],
  };
}

function createListeningTimeline(flow: VoiceAgentFlow): TimelineStep[] {
  return [createTimelineStep(flow, 0, 'active')];
}

function formatTranscriptPreview(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return '"Awaiting instruction..."';
  }

  const clipped = trimmed.length > 72 ? `${trimmed.slice(0, 69)}...` : trimmed;
  return `"${clipped}"`;
}

function createJobId(): string {
  const suffix = `${Math.floor(1000 + Math.random() * 9000)}`;
  return `JOB_ID: AF-${suffix}`;
}

function createCommand(text: string, flow: VoiceAgentFlow): VoiceAgentCommand {
  const normalizedText = text.trim().toLowerCase();
  return {
    id: `cmd-${normalizedText.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'voice'}`,
    rawText: text.trim(),
    normalizedText,
    flowId: flow.id,
    targetCapabilityId: flow.capabilityId,
    jobId: createJobId(),
  };
}

function badgeLabelForStatus(status: TimelineStepStatus): string {
  switch (status) {
    case 'completed':
      return 'COMPLETED';
    case 'active':
      return 'EXECUTING';
    case 'waiting_approval':
      return 'PENDING';
    case 'blocked':
      return 'BLOCKED';
    case 'error':
      return 'ERROR';
    default:
      return 'PENDING';
  }
}

function activeBadgeLabel(phase: VoiceAgentFlow['steps'][number]['phase']): string {
  switch (phase) {
    case 'listening':
      return 'LISTENING';
    case 'processing':
      return 'PROCESSING';
    case 'completed':
      return 'FINALIZING';
    default:
      return 'EXECUTING';
  }
}

function createTimelineStep(
  flow: VoiceAgentFlow,
  index: number,
  status: TimelineStepStatus,
): TimelineStep {
  const template = flow.steps[index];
  return {
    id: template.id,
    title: template.title,
    subtitle: template.subtitle,
    icon: template.icon,
    status,
    badgeLabel: status === 'active' ? activeBadgeLabel(template.phase) : badgeLabelForStatus(status),
  };
}

function resetActiveCapabilities(
  capabilities: VoiceAgentCapability[],
): VoiceAgentCapability[] {
  return capabilities.map((capability) => {
    if (capability.status !== 'active') {
      return capability;
    }

    return setCapabilityStatus(capability, 'connected');
  });
}

function markCapabilitiesActive(
  capabilities: VoiceAgentCapability[],
  toolNames: string[],
): VoiceAgentCapability[] {
  if (toolNames.length === 0) {
    return resetActiveCapabilities(capabilities);
  }

  const activeToolNames = new Set(toolNames);
  return capabilities.map((capability) => {
    if (activeToolNames.has(capability.id)) {
      return setCapabilityStatus(capability, 'active');
    }

    if (capability.status === 'active') {
      return setCapabilityStatus(capability, 'connected');
    }

    return capability;
  });
}

function truncateSummary(value: string, maxLength = 48): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 3)}...` : trimmed;
}

function readStringArg(args: unknown, key: string): string | null {
  if (!isRecord(args) || typeof args[key] !== 'string') {
    return null;
  }

  return args[key];
}

function formatToolMetricValue(name: string, args: unknown): string {
  switch (name) {
    case 'send_email': {
      const recipient = readStringArg(args, 'to');
      return recipient ? `Email to ${recipient}` : 'Prepared email';
    }
    case 'schedule_event': {
      const title = readStringArg(args, 'title');
      return title ? `Scheduled ${truncateSummary(title)}` : 'Scheduled event successfully';
    }
    case 'search_web': {
      const query = readStringArg(args, 'query');
      return query ? `Searched "${truncateSummary(query)}"` : 'Searched the web';
    }
    case 'search_contact': {
      const contactName = readStringArg(args, 'name');
      return contactName ? `Looked up ${truncateSummary(contactName)}` : 'Searched contacts';
    }
    case 'send_imessage': {
      const recipient = readStringArg(args, 'recipient');
      return recipient ? `Messaged ${truncateSummary(recipient)}` : 'Sent message successfully';
    }
    case 'make_call': {
      const recipient = readStringArg(args, 'recipient');
      return recipient ? `Called ${truncateSummary(recipient)}` : 'Started a call';
    }
    case 'changeThemeColor': {
      const color = readStringArg(args, 'color');
      return color ? `Changed theme to ${truncateSummary(color)}` : 'Updated theme color';
    }
    case 'update_daily_tasks': {
      if (isRecord(args) && Array.isArray(args.tasks)) {
        const taskCount = args.tasks.filter((task) => typeof task === 'string').length;
        if (taskCount > 0) {
          return `Updated ${taskCount} daily task${taskCount === 1 ? '' : 's'}`;
        }
      }

      return 'Updated daily tasks';
    }
    default:
      return 'Executed successfully';
  }
}

function titleFromToolName(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function descriptorForTool(name: string): ToolCapabilityDescriptor {
  return (
    TOOL_CAPABILITY_DESCRIPTORS[name] ?? {
      title: titleFromToolName(name),
      icon: 'spark',
      metricLabel: 'Last Usage',
    }
  );
}

function upsertCompletedCapabilities(
  capabilities: VoiceAgentCapability[],
  toolCalls: PendingToolCall[],
): VoiceAgentCapability[] {
  const nextCapabilities = [...resetActiveCapabilities(capabilities)];
  const latestToolCalls = new Map<string, PendingToolCall>();

  toolCalls.forEach((toolCall) => {
    latestToolCalls.set(toolCall.name, toolCall);
  });

  latestToolCalls.forEach((toolCall, toolName) => {
    const descriptor = descriptorForTool(toolName);
    const capability: VoiceAgentCapability = {
      id: toolName,
      title: descriptor.title,
      icon: descriptor.icon,
      status: 'connected',
      metricLabel: descriptor.metricLabel,
      metricValue: formatToolMetricValue(toolName, toolCall.args),
      connectionLabel: connectionLabelForStatus('connected'),
      isInteractive: true,
    };
    const existingIndex = nextCapabilities.findIndex((entry) => entry.id === toolName);

    if (existingIndex === -1) {
      nextCapabilities.push(capability);
      return;
    }

    nextCapabilities[existingIndex] = capability;
  });

  return nextCapabilities;
}

function upsertPendingToolCall(
  pendingToolCalls: PendingToolCall[],
  toolCall: PendingToolCall,
): PendingToolCall[] {
  const existingIndex = pendingToolCalls.findIndex(
    (entry) => entry.callId === toolCall.callId || entry.name === toolCall.name,
  );
  if (existingIndex === -1) {
    return [...pendingToolCalls, toolCall];
  }

  const nextPendingToolCalls = [...pendingToolCalls];
  nextPendingToolCalls[existingIndex] = toolCall;
  return nextPendingToolCalls;
}

function completeCommand(
  state: VoiceAgentReducerState,
  hintText: string,
): VoiceAgentReducerState {
  const listeningFlow = state.activeFlow ?? resolveMockVoiceFlow('');

  return {
    ...state,
    uiState: 'listening',
    hintText,
    errorMessage: null,
    capabilities: upsertCompletedCapabilities(state.capabilities, state.pendingToolCalls),
    timelineSteps: createListeningTimeline(listeningFlow),
    approvalRequest: null,
    activeFlow: listeningFlow,
    activeStepIndex: 0,
    pendingToolCalls: [],
  };
}

function syncLatestEmailDraft(
  state: VoiceAgentReducerState,
  request: ApprovalRequest | null,
  draftStatus: EmailDraftLifecycleStatus | null,
): Pick<
  VoiceAgentReducerState,
  'latestEmailDraft' | 'latestEmailDraftStatus' | 'capabilities'
> {
  if (!request || !draftStatus) {
    return {
      latestEmailDraft: state.latestEmailDraft,
      latestEmailDraftStatus: state.latestEmailDraftStatus,
      capabilities: state.capabilities,
    };
  }

  return {
    latestEmailDraft: request,
    latestEmailDraftStatus: draftStatus,
    capabilities: upsertEmailDraftCapability(state.capabilities, request, draftStatus),
  };
}

function withErrorState(
  state: VoiceAgentReducerState,
  message: string,
): VoiceAgentReducerState {
  const timelineSteps: TimelineStep[] =
    state.timelineSteps.length === 0
      ? []
      : state.timelineSteps.map((step, index): TimelineStep => {
          if (index < state.activeStepIndex) {
            return step;
          }

          if (index === state.activeStepIndex) {
            return {
              ...step,
              status: 'error',
              badgeLabel: badgeLabelForStatus('error'),
            };
          }

          return {
            ...step,
            status: 'blocked',
            badgeLabel: badgeLabelForStatus('blocked'),
          };
        });

  return {
    ...state,
    uiState: 'error',
    errorMessage: message,
    hintText: message,
    isSessionActive: false,
    approvalRequest: null,
    timelineSteps,
    activeFlow: null,
    activeStepIndex: -1,
    pendingToolCalls: [],
    capabilities: state.capabilities.map((capability) => ({
      ...capability,
      status: capability.status === 'active' ? 'degraded' : capability.status,
      connectionLabel:
        capability.status === 'active'
      ? connectionLabelForStatus('degraded')
          : capability.connectionLabel,
    })),
    selectedCapabilityId: null,
  };
}

function reducer(state: VoiceAgentReducerState, action: VoiceAgentAction): VoiceAgentReducerState {
  switch (action.type) {
    case 'BEGIN_LISTENING':
      {
        const flow = state.activeFlow ?? resolveMockVoiceFlow('');

      return {
        ...state,
        uiState: 'listening',
        transcriptPreview:
          state.isSessionActive && state.command?.rawText
            ? formatTranscriptPreview(state.command.rawText)
            : '"Awaiting instruction..."',
        hintText: 'Awaiting live instruction...',
        errorMessage: null,
        approvalRequest: null,
        timelineSteps: createListeningTimeline(flow),
        capabilities: state.isSessionActive
          ? state.capabilities
          : cloneCapabilities(state.baseCapabilities),
        command: state.isSessionActive ? state.command : null,
        jobId: state.isSessionActive ? state.jobId : 'JOB_ID: -- ----',
        activeFlow: flow,
        activeStepIndex: 0,
      };
      }
    case 'SESSION_CONNECTED':
      {
        const flow = state.activeFlow ?? resolveMockVoiceFlow('');

      return {
        ...state,
        isSessionActive: true,
        uiState: 'listening',
        timelineSteps: createListeningTimeline(flow),
        activeFlow: flow,
        activeStepIndex: 0,
      };
      }
    case 'SESSION_STOPPED':
      return createInitialState(state.baseCapabilities);
    case 'INGEST_EVENT': {
      const event = action.event;

      switch (event.type) {
        case 'audio':
          return state;
        case 'state':
          if (state.uiState === 'error') {
            return state;
          }

          if (!event.speaking && state.isSessionActive) {
            if (shouldIgnoreSpeakingState(state, event.speaking)) {
              return state;
            }

            const capabilities =
              state.pendingToolCalls.length > 0
                ? upsertCompletedCapabilities(state.capabilities, state.pendingToolCalls)
                : resetActiveCapabilities(state.capabilities);
            const flow = state.activeFlow ?? resolveMockVoiceFlow('');

            return {
              ...state,
              uiState: 'listening',
              hintText: 'Awaiting live instruction...',
              timelineSteps: createListeningTimeline(flow),
              capabilities,
              activeFlow: flow,
              activeStepIndex: 0,
              pendingToolCalls: [],
            };
          }

          return state;
        case 'transcript':
          if (event.role === 'assistant') {
            return {
              ...state,
              hintText:
                state.uiState === 'completed'
                  ? 'Ready for the next instruction.'
                  : state.hintText,
            };
          }

          if (!event.text.trim()) {
            return state;
          }

          if (hasPendingApproval(state)) {
            return {
              ...state,
              transcriptPreview: formatTranscriptPreview(event.text),
              hintText: 'Resolving the pending email draft by voice...',
            };
          }

          const flow = resolveMockVoiceFlow(event.text);
          const command = createCommand(event.text, flow);

          return {
            ...state,
            uiState: 'listening',
            transcriptPreview: formatTranscriptPreview(command.rawText),
            timelineSteps: createListeningTimeline(flow),
            approvalRequest: null,
            capabilities: resetActiveCapabilities(state.capabilities),
            command,
            jobId: command.jobId,
            hintText: 'Listening to user intent...',
            errorMessage: null,
            activeFlow: flow,
            activeStepIndex: 0,
            pendingToolCalls: [],
          };
        case 'tool_call':
          {
            const pendingToolCalls = state.pendingToolCalls.some(
              (toolCall) => toolCall.callId === event.callId,
            )
              ? state.pendingToolCalls
              : [
                  ...state.pendingToolCalls,
                  {
                    callId: event.callId,
                    name: event.name,
                    args: event.args,
                  },
                ];

            return {
              ...state,
              capabilities: markCapabilitiesActive(
                state.capabilities,
                pendingToolCalls.map((toolCall) => toolCall.name),
              ),
              pendingToolCalls,
            };
          }
        case 'error':
          return withErrorState(state, event.message);
        case 'step_update': {
          const stepIndex = state.timelineSteps.findIndex((step) => step.id === event.stepId);
          if (stepIndex === -1) {
            return state;
          }

          const nextTimelineSteps: TimelineStep[] = state.timelineSteps.map((step, index): TimelineStep =>
            index === stepIndex
              ? {
                  ...step,
                  title: event.title ?? step.title,
                  subtitle: event.subtitle ?? step.subtitle,
                  status: event.status,
                  badgeLabel: badgeLabelForStatus(event.status),
                }
              : step,
          );

          return {
            ...state,
            timelineSteps: nextTimelineSteps,
          };
        }
        case 'approval_requested':
          {
            const approvalTimeline = upsertApprovalTimeline(state.timelineSteps, event.request);
            const pendingToolCalls = upsertPendingToolCall(state.pendingToolCalls, {
              callId: event.request.id,
              name: event.request.toolName,
              args: event.request.preview
                ? {
                    to: event.request.preview.to,
                    subject: event.request.preview.subject,
                    body: event.request.preview.body,
                    email_type: event.request.preview.emailType,
                    link: event.request.preview.link ?? '',
                  }
                : {},
            });
            const latestDraftState = syncLatestEmailDraft(state, event.request, 'pending');

          return {
            ...state,
            uiState: 'waiting_approval',
            approvalRequest: event.request,
            latestEmailDraft: latestDraftState.latestEmailDraft,
            latestEmailDraftStatus: latestDraftState.latestEmailDraftStatus,
            hintText: "Say 'send it', 'cancel it', or describe what should change.",
            timelineSteps: approvalTimeline.timelineSteps,
            capabilities: latestDraftState.capabilities,
            activeStepIndex: approvalTimeline.activeStepIndex,
            pendingToolCalls,
          };
          }
        case 'approval_resolved':
          return reducer(state, {
            type: 'RESOLVE_APPROVAL',
            decision: event.decision,
          });
        case 'completed':
          if (shouldIgnoreCompletedState(state)) {
            return state;
          }

          return completeCommand(
            state,
            event.message ?? 'Ready for the next instruction.',
          );
        default:
          return state;
      }
    }
    case 'ADVANCE_FLOW': {
      return state;
    }
    case 'RESOLVE_APPROVAL': {
      const listeningFlow = state.activeFlow ?? resolveMockVoiceFlow('');
      const resolvedStatus = approvalDecisionToDraftStatus(action.decision);
      const latestDraft = state.approvalRequest ?? state.latestEmailDraft;
      const capabilities = latestDraft
        ? upsertEmailDraftCapability(
            resetActiveCapabilities(state.capabilities),
            latestDraft,
            resolvedStatus,
          )
        : resetActiveCapabilities(state.capabilities);

      return {
        ...state,
        uiState: 'listening',
        approvalRequest: null,
        latestEmailDraft: latestDraft,
        latestEmailDraftStatus: latestDraft ? resolvedStatus : state.latestEmailDraftStatus,
        hintText: 'Listening to user intent...',
        timelineSteps: createListeningTimeline(listeningFlow),
        activeFlow: listeningFlow,
        activeStepIndex: 0,
        capabilities,
        pendingToolCalls: [],
      };
    }
    case 'TOGGLE_CAPABILITY_DETAIL':
      return {
        ...state,
        selectedCapabilityId:
          state.selectedCapabilityId === action.capabilityId
            ? null
            : action.capabilityId,
      };
    default:
      return state;
  }
}

export function useVoiceAgentUIState(
  options: UseVoiceAgentUIStateOptions = {},
) {
  const capabilitySeed = useMemo(
    () => options.capabilities ?? [],
    [options.capabilities],
  );
  const [state, dispatch] = useReducer(reducer, capabilitySeed, createInitialState);

  useEffect(() => {
    if (!state.activeFlow || state.activeStepIndex < 0) {
      return undefined;
    }

    if (state.uiState === 'waiting_approval' || state.uiState === 'error') {
      return undefined;
    }

    const currentTemplate = state.activeFlow.steps[state.activeStepIndex];
    if (!currentTemplate || !currentTemplate.autoAdvanceMs) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      dispatch({type: 'ADVANCE_FLOW'});
    }, currentTemplate.autoAdvanceMs);

    return () => window.clearTimeout(timer);
  }, [state.activeFlow, state.activeStepIndex, state.uiState]);

  return {
    state,
    beginListening: () => dispatch({type: 'BEGIN_LISTENING'}),
    markSessionConnected: () => dispatch({type: 'SESSION_CONNECTED'}),
    stopSession: () => dispatch({type: 'SESSION_STOPPED'}),
    dispatchEvent: (event: AgentEventPayload) => dispatch({type: 'INGEST_EVENT', event}),
    toggleCapabilityDetail: (capabilityId: string) =>
      dispatch({type: 'TOGGLE_CAPABILITY_DETAIL', capabilityId}),
  };
}
