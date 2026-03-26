import {useEffect, useRef, useState} from 'react';
import {
  VoiceAgentOverlay,
  createApprovalResolutionEvent,
  mapRealtimeMessageToAgentEvents,
  useVoiceAgentUIState,
} from './features/voice-agent';
import {AudioRecorder, AudioStreamer} from './service/audioService';

const WS_URL =
  import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:8765`;

interface RuntimeState {
  error: string | null;
  themeColor: string;
  tasks: string[];
}

const INITIAL_RUNTIME_STATE: RuntimeState = {
  error: null,
  themeColor: '#0000ee',
  tasks: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getMicrophoneErrorMessage(error: {name?: string}) {
  if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
    return 'Microphone access is blocked. Please allow microphone access in your browser and refresh.';
  }

  if (error.name === 'NotFoundError') {
    return 'No microphone detected. Please connect a microphone and try again.';
  }

  if (error.name === 'NotSupportedError') {
    return 'Microphone not supported. Please use Chrome or Edge over HTTPS.';
  }

  return 'Microphone access denied.';
}

export default function App() {
  const [runtimeState, setRuntimeState] = useState(INITIAL_RUNTIME_STATE);
  const [isPowerOn, setIsPowerOn] = useState(false);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const {
    state: voiceAgentState,
    beginListening,
    markSessionConnected,
    stopSession,
    dispatchEvent,
  } = useVoiceAgentUIState();

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', runtimeState.themeColor);
  }, [runtimeState.themeColor]);

  const teardownAssistant = (fromSocket = false) => {
    audioRecorderRef.current?.stop();
    audioRecorderRef.current = null;
    audioStreamerRef.current?.stop();
    audioStreamerRef.current = null;

    if (!fromSocket && wsRef.current) {
      const socket = wsRef.current;
      wsRef.current = null;
      socket.onclose = null;
      socket.close();
    } else {
      wsRef.current = null;
    }

    setIsPowerOn(false);
  };

  const stopAssistant = (fromSocket = false) => {
    teardownAssistant(fromSocket);
    setRuntimeState(INITIAL_RUNTIME_STATE);
    stopSession();
  };

  const handleFrontendTool = (
    callId: string,
    name: string,
    args: unknown,
    ws: WebSocket,
  ) => {
    let result = 'done';

    if (name === 'changeThemeColor' && isRecord(args) && typeof args.color === 'string') {
      setRuntimeState((previous) => ({
        ...previous,
        themeColor: args.color,
      }));
      result = `Theme color updated to ${args.color}`;
    } else if (
      name === 'update_daily_tasks' &&
      isRecord(args) &&
      Array.isArray(args.tasks)
    ) {
      setRuntimeState((previous) => ({
        ...previous,
        tasks: args.tasks.filter((task): task is string => typeof task === 'string'),
      }));
      result = 'Tasks updated.';
    }

    ws.send(JSON.stringify({type: 'tool_result', call_id: callId, result}));
  };

  const handleRealtimeMessage = (message: unknown, ws: WebSocket) => {
    const agentEvents = mapRealtimeMessageToAgentEvents(message);

    if (isRecord(message) && message.type === 'audio' && typeof message.data === 'string') {
      audioStreamerRef.current?.playChunk(message.data);
    }

    if (isRecord(message) && message.type === 'tool_call') {
      if (typeof message.call_id === 'string' && typeof message.name === 'string') {
        handleFrontendTool(message.call_id, message.name, message.args, ws);
      }
    }

    if (isRecord(message) && message.type === 'error' && typeof message.message === 'string') {
      setRuntimeState((previous) => ({
        ...previous,
        error: message.message,
      }));
    }

    if (isRecord(message) && message.type === 'transcript') {
      setRuntimeState((previous) => ({
        ...previous,
        error: null,
      }));
    }

    agentEvents.forEach((event) => {
      dispatchEvent(event);
    });
  };

  const startAssistant = async () => {
    if (wsRef.current) {
      return;
    }

    beginListening();
    setRuntimeState((previous) => ({
      ...previous,
      error: null,
    }));

    try {
      audioStreamerRef.current = new AudioStreamer();
      audioRecorderRef.current = new AudioRecorder((base64) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({type: 'audio', data: base64}));
        }
      });
      await audioRecorderRef.current.start();
    } catch (error) {
      const errorMessage = getMicrophoneErrorMessage(error as {name?: string});
      setRuntimeState((previous) => ({
        ...previous,
        error: errorMessage,
      }));
      dispatchEvent({type: 'error', message: errorMessage});
      return;
    }

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsPowerOn(true);
      markSessionConnected();
    };

    ws.onmessage = (event) => {
      handleRealtimeMessage(JSON.parse(event.data), ws);
    };

    ws.onclose = () => {
      stopAssistant(true);
    };

    ws.onerror = () => {
      const errorMessage = 'Cannot connect to Desir server. Run: uv run python server.py';
      setRuntimeState((previous) => ({
        ...previous,
        error: errorMessage,
      }));
      dispatchEvent({type: 'error', message: errorMessage});
      ws.onclose = null;
      teardownAssistant(true);
    };
  };

  const togglePower = () => {
    if (isPowerOn) {
      stopAssistant();
      return;
    }

    void startAssistant();
  };

  const resolveApproval = (decision: 'approved' | 'edited' | 'cancelled') => {
    const requestId = voiceAgentState.approvalRequest?.id ?? 'local-approval';
    dispatchEvent(createApprovalResolutionEvent(requestId, decision));
  };

  return (
    <VoiceAgentOverlay
      uiState={voiceAgentState.uiState}
      transcriptPreview={voiceAgentState.transcriptPreview}
      timelineSteps={voiceAgentState.timelineSteps}
      approvalRequest={voiceAgentState.approvalRequest}
      capabilities={voiceAgentState.capabilities}
      tasks={runtimeState.tasks}
      jobId={voiceAgentState.jobId}
      hintText={voiceAgentState.errorMessage ?? voiceAgentState.hintText}
      editStubMessage={voiceAgentState.editStubMessage}
      accentColor={runtimeState.themeColor}
      onOrbClick={togglePower}
      onApprove={() => resolveApproval('approved')}
      onEdit={() => resolveApproval('edited')}
      onCancel={() => resolveApproval('cancelled')}
    />
  );
}
