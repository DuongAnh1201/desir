import {VoiceAgentFlow} from '../types/voiceAgent.types';

const genericFlow: VoiceAgentFlow = {
  id: 'generic-assistant-flow',
  capabilityId: 'assistant',
  matcher: [/.*/],
  approvalRequest: null,
  steps: [
    {
      id: 'generic-listen',
      title: 'Listening to user intent',
      subtitle: 'Realtime capture: active',
      icon: 'mic',
      phase: 'listening',
    },
  ],
};

export const mockVoiceFlows: VoiceAgentFlow[] = [genericFlow];

export function resolveMockVoiceFlow(transcript: string): VoiceAgentFlow {
  const normalizedTranscript = transcript.trim();
  return (
    mockVoiceFlows.find((flow) =>
      flow.matcher.some((pattern) => pattern.test(normalizedTranscript)),
    ) ??
    genericFlow
  );
}
