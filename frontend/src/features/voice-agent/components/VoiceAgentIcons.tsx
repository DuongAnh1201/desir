import {PropsWithChildren} from 'react';
import {VoiceAgentIconName} from '../types/voiceAgent.types';

interface IconProps {
  className?: string;
}

function IconBase({children, className}: PropsWithChildren<IconProps>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function VoiceAgentIcon({
  name,
  className,
}: {
  name: VoiceAgentIconName;
  className?: string;
}) {
  switch (name) {
    case 'desir':
      return (
        <IconBase className={className}>
          <path d="M12 4v16" />
          <path d="M4 12h16" />
          <path d="M7 7l10 10" />
          <path d="M17 7L7 17" />
        </IconBase>
      );
    case 'mail':
      return (
        <IconBase className={className}>
          <rect x="4" y="6" width="16" height="12" rx="2" />
          <path d="m5 8 7 5 7-5" />
        </IconBase>
      );
    case 'calendar':
      return (
        <IconBase className={className}>
          <rect x="5" y="6" width="14" height="13" rx="2" />
          <path d="M8 4v4" />
          <path d="M16 4v4" />
          <path d="M5 10h14" />
        </IconBase>
      );
    case 'slack':
      return (
        <IconBase className={className}>
          <path d="M9 5a2 2 0 1 0-4 0v3h4V5Z" />
          <path d="M19 9a2 2 0 1 0 0-4h-3v4h3Z" />
          <path d="M15 19a2 2 0 1 0 4 0v-3h-4v3Z" />
          <path d="M5 15a2 2 0 1 0 0 4h3v-4H5Z" />
          <path d="M9 8v8" />
          <path d="M16 8v8" />
          <path d="M8 9h8" />
          <path d="M8 16h8" />
        </IconBase>
      );
    case 'settings':
      return (
        <IconBase className={className}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3.5v2.25" />
          <path d="M12 18.25v2.25" />
          <path d="m5.99 5.99 1.59 1.59" />
          <path d="m16.42 16.42 1.59 1.59" />
          <path d="M3.5 12h2.25" />
          <path d="M18.25 12h2.25" />
          <path d="m5.99 18.01 1.59-1.59" />
          <path d="m16.42 7.58 1.59-1.59" />
        </IconBase>
      );
    case 'user':
      return (
        <IconBase className={className}>
          <circle cx="12" cy="8" r="3" />
          <path d="M6.5 18c1.8-2.5 9.2-2.5 11 0" />
        </IconBase>
      );
    case 'mic':
      return (
        <IconBase className={className}>
          <rect x="9" y="4.5" width="6" height="10" rx="3" />
          <path d="M7 11.5a5 5 0 0 0 10 0" />
          <path d="M12 16.5v3" />
        </IconBase>
      );
    case 'brain':
      return (
        <IconBase className={className}>
          <path d="M9.75 5.25A3.25 3.25 0 0 0 6.5 8.5v6A2.5 2.5 0 0 0 9 17h1v-5H8.5" />
          <path d="M14.25 5.25A3.25 3.25 0 0 1 17.5 8.5v6A2.5 2.5 0 0 1 15 17h-1v-5h1.5" />
          <path d="M10 6.5c0-1.1.9-2 2-2s2 .9 2 2" />
          <path d="M10 12h4" />
        </IconBase>
      );
    case 'contact':
      return (
        <IconBase className={className}>
          <circle cx="12" cy="8.5" r="3" />
          <path d="M5.5 18c1.9-2.8 11.1-2.8 13 0" />
          <path d="M4 4h2" />
          <path d="M18 4h2" />
        </IconBase>
      );
    case 'lock':
      return (
        <IconBase className={className}>
          <rect x="6" y="10" width="12" height="9" rx="2" />
          <path d="M9 10V8a3 3 0 0 1 6 0v2" />
        </IconBase>
      );
    case 'spark':
      return (
        <IconBase className={className}>
          <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
        </IconBase>
      );
    case 'check':
      return (
        <IconBase className={className}>
          <path d="m5 12 4.5 4.5L19 7" />
        </IconBase>
      );
    case 'x':
      return (
        <IconBase className={className}>
          <path d="m6 6 12 12" />
          <path d="M18 6 6 18" />
        </IconBase>
      );
    case 'waveform':
      return (
        <IconBase className={className}>
          <path d="M5 14V10" />
          <path d="M8 16V8" />
          <path d="M11 18V6" />
          <path d="M14 15V9" />
          <path d="M17 13v-2" />
          <path d="M20 14V10" />
        </IconBase>
      );
    default:
      return (
        <IconBase className={className}>
          <circle cx="12" cy="12" r="8" />
        </IconBase>
      );
  }
}
