import {ApprovalRequest} from '../types/voiceAgent.types';

export function ApprovalCard({
  request,
  editStubMessage,
  onApprove,
  onEdit,
  onCancel,
}: {
  request: ApprovalRequest;
  editStubMessage: string | null;
  onApprove: () => void;
  onEdit: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="rounded-[4px] border bg-[#111111] p-[17px]"
      style={{borderColor: 'var(--voice-agent-border)'}}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[13px] font-semibold text-white">{request.title}</div>
          <div className="mt-2 text-[11px] text-[#a3a3a3]">{request.summary}</div>
          <div className="mt-1 text-[10.9px] text-[#737373]">{request.detail}</div>
          {editStubMessage ? (
            <div className="mt-3 text-[10px] uppercase tracking-[1px] text-[#f59e0b]">
              {editStubMessage}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-[4px] border px-3 py-2 text-[10px] uppercase tracking-[1px] text-[#a3a3a3] transition-colors hover:text-white"
          style={{borderColor: 'var(--voice-agent-border)', fontFamily: 'var(--font-voice-agent-mono)'}}
        >
          {request.editLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[4px] border px-3 py-2 text-[10px] uppercase tracking-[1px] text-[#a3a3a3] transition-colors hover:border-[#ef4444] hover:text-[#ef4444]"
          style={{borderColor: 'var(--voice-agent-border)', fontFamily: 'var(--font-voice-agent-mono)'}}
        >
          {request.cancelLabel}
        </button>
        <button
          type="button"
          onClick={onApprove}
          className="rounded-[4px] px-3 py-2 text-[10px] font-semibold uppercase tracking-[1px] text-white"
          style={{
            backgroundColor: 'var(--voice-agent-live-accent)',
            fontFamily: 'var(--font-voice-agent-mono)',
          }}
        >
          {request.approveLabel}
        </button>
      </div>
    </div>
  );
}
