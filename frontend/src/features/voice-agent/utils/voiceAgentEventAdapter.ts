import {AgentEventPayload, ApprovalRequest} from '../types/voiceAgent.types';

type BrowserRealtimeMessage =
  | {type: 'audio'; data: string}
  | {type: 'state'; speaking: boolean}
  | {type: 'transcript'; role: 'user' | 'assistant'; text: string}
  | {type: 'tool_call'; call_id: string; name: string; args: unknown}
  | {type: 'approval_request'; request: ApprovalRequest}
  | {type: 'error'; message: string};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function mapRealtimeMessageToAgentEvents(message: unknown): AgentEventPayload[] {
  if (!isRecord(message) || typeof message.type !== 'string') {
    return [];
  }

  const typedMessage = message as BrowserRealtimeMessage;

  switch (typedMessage.type) {
    case 'audio':
      return typeof typedMessage.data === 'string'
        ? [{type: 'audio', data: typedMessage.data}]
        : [];
    case 'state':
      return typeof typedMessage.speaking === 'boolean'
        ? [{type: 'state', speaking: typedMessage.speaking}]
        : [];
    case 'transcript':
      return typeof typedMessage.text === 'string' &&
        (typedMessage.role === 'user' || typedMessage.role === 'assistant')
        ? [{type: 'transcript', role: typedMessage.role, text: typedMessage.text}]
        : [];
    case 'tool_call':
      return typeof typedMessage.name === 'string' && typeof typedMessage.call_id === 'string'
        ? [
            {
              type: 'tool_call',
              callId: typedMessage.call_id,
              name: typedMessage.name,
              args: typedMessage.args,
            },
          ]
        : [];
    case 'approval_request':
      return typedMessage.request
        ? [{type: 'approval_requested', request: typedMessage.request}]
        : [];
    case 'error':
      return typeof typedMessage.message === 'string'
        ? [{type: 'error', message: typedMessage.message}]
        : [];
    default:
      return [];
  }
}
