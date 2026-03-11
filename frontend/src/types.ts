export type Emotion =
  | 'happy'
  | 'happiness'
  | 'sad'
  | 'sadness'
  | 'humble'
  | 'confused'
  | 'thinking'
  | 'smile'
  | 'neutral';

export interface AssistantState {
  emotion: Emotion;
  isSpeaking: boolean;
  error: string | null;
  themeColor: string;
  tasks: string[];
}

export const INITIAL_STATE: AssistantState = {
  emotion: 'neutral',
  isSpeaking: false,
  error: null,
  themeColor: '#00f2ff',
  tasks: [],
};
