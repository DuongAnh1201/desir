import {X} from 'lucide-react';
import {
  ApprovalRequest,
  EmailDraftLifecycleStatus,
} from '../types/voiceAgent.types';
import {ApprovalCard} from './ApprovalCard';

export function CapabilityDetailViewer({
  request,
  draftStatus,
  editStubMessage,
  onApprove,
  onCancel,
  onClose,
}: {
  request: ApprovalRequest | null;
  draftStatus: EmailDraftLifecycleStatus | null;
  editStubMessage: string | null;
  onApprove: (draft?: NonNullable<ApprovalRequest['preview']>) => void;
  onCancel: () => void;
  onClose: () => void;
}) {
  if (!request || !draftStatus) {
    return null;
  }

  const isPendingDraft = draftStatus === 'pending';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <button
        type="button"
        aria-label="Close draft viewer"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-full w-full max-w-[1040px] flex-col overflow-hidden rounded-[18px] border bg-[#050505] shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{borderColor: 'var(--voice-agent-border)'}}
        >
          <div>
            <div className="text-[10px] uppercase tracking-[1.2px] text-[#737373]">
              System Capability Detail
            </div>
            <div className="mt-1 text-[15px] font-semibold text-white">
              Email Template
            </div>
          </div>
          <button
            type="button"
            aria-label="Close email draft"
            className="rounded-full border p-2 text-[#a3a3a3] transition-colors hover:text-white"
            style={{borderColor: 'var(--voice-agent-border)'}}
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-auto p-5">
          <ApprovalCard
            request={request}
            draftStatus={draftStatus}
            editStubMessage={isPendingDraft ? editStubMessage : null}
            onApprove={isPendingDraft ? onApprove : undefined}
            onCancel={isPendingDraft ? onCancel : undefined}
          />
        </div>
      </div>
    </div>
  );
}
