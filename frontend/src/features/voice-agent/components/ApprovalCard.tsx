import {useEffect, useState} from 'react';
import {Mail} from 'lucide-react';
import {ApprovalRequest, EmailDraftLifecycleStatus} from '../types/voiceAgent.types';

interface EditableApprovalPreview {
  to: string;
  subject: string;
  body: string;
  emailType: string;
  link: string;
}

function toEditablePreview(
  preview: ApprovalRequest['preview'],
): EditableApprovalPreview | null {
  if (!preview) {
    return null;
  }

  return {
    to: preview.to,
    subject: preview.subject,
    body: preview.body,
    emailType: preview.emailType,
    link: preview.link ?? '',
  };
}

export function ApprovalCard({
  request,
  draftStatus = 'pending',
  editStubMessage,
  onApprove,
  onCancel,
}: {
  request: ApprovalRequest;
  draftStatus?: EmailDraftLifecycleStatus;
  editStubMessage: string | null;
  onApprove?: (draft?: NonNullable<ApprovalRequest['preview']>) => void;
  onCancel?: () => void;
}) {
  const isPendingDraft = draftStatus === 'pending';
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<EditableApprovalPreview | null>(() =>
    toEditablePreview(request.preview),
  );
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  useEffect(() => {
    setDraft(toEditablePreview(request.preview));
    setIsEditing(false);
    setValidationMessage(null);
  }, [request, draftStatus]);

  const emailTypeLabel =
    draft?.emailType === 'notification' ? 'Notification Email' : 'User Request';
  const draftStatusLabel =
    draftStatus === 'approved'
      ? 'Approved'
      : draftStatus === 'rejected'
        ? 'Rejected'
        : 'Pending Approval';
  const draftStatusClassName =
    draftStatus === 'approved'
      ? 'border-[#166534] bg-[#052e16] text-[#86efac]'
      : draftStatus === 'rejected'
        ? 'border-[#7f1d1d] bg-[#2a1111] text-[#fca5a5]'
        : 'border-[#92400e] bg-[#2b1906] text-[#fcd34d]';

  const updateDraft = (
    field: keyof Pick<EditableApprovalPreview, 'to' | 'subject' | 'body' | 'link'>,
    value: string,
  ) => {
    if (!isPendingDraft) {
      return;
    }

    setDraft((currentDraft) =>
      currentDraft
        ? {
            ...currentDraft,
            [field]: value,
          }
        : currentDraft,
    );
    setValidationMessage(null);
  };

  const handleApprove = () => {
    if (!isPendingDraft || !onApprove) {
      return;
    }

    if (!draft) {
      onApprove();
      return;
    }

    const normalizedDraft = {
      to: draft.to.trim(),
      subject: draft.subject.trim(),
      body: draft.body.trim(),
      emailType: draft.emailType,
      link: draft.link.trim() || null,
    };

    if (!normalizedDraft.to) {
      setValidationMessage('Recipient email is required before sending.');
      setIsEditing(true);
      return;
    }

    if (!normalizedDraft.subject) {
      setValidationMessage('Subject is required before sending.');
      setIsEditing(true);
      return;
    }

    if (!normalizedDraft.body) {
      setValidationMessage('Message body is required before sending.');
      setIsEditing(true);
      return;
    }

    onApprove(normalizedDraft);
  };

  const fieldClassName = `w-full rounded-[6px] border px-4 py-3 text-[12px] leading-5 text-white outline-none transition ${
    isPendingDraft && isEditing
      ? 'bg-[#050505] focus:border-[var(--voice-agent-live-accent)]'
      : 'cursor-default bg-[#0d0d0d] text-[#d4d4d4]'
  }`;

  return (
    <div
      className="rounded-[10px] border bg-[#111111] p-5"
      style={{borderColor: 'var(--voice-agent-border)'}}
    >
      <div className="flex items-start gap-4">
        <div className="mt-0.5 rounded-[8px] border border-white/10 bg-white/5 p-3 text-[#d4d4d4]">
          <Mail size={22} strokeWidth={1.8} />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[10px] uppercase tracking-[1.2px] text-[#737373]">
              {request.title}
            </div>
            <div className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[1px] ${draftStatusClassName}`}>
              {draftStatusLabel}
            </div>
          </div>
          <div className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-white">
            Edit Template
          </div>
          <div className="mt-2 max-w-[560px] text-[12px] leading-6 text-[#a3a3a3]">
            {request.detail}
          </div>
          <div className="mt-1 text-[11px] text-[#737373]">{request.summary}</div>
        </div>
      </div>

      <div
        className="mt-6 rounded-[10px] border bg-black/20 p-4"
        style={{borderColor: 'var(--voice-agent-border)'}}
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <label className="grid gap-2">
            <span className="text-[11px] font-medium uppercase tracking-[1px] text-[#737373]">
              Recipient
            </span>
            <input
              type="email"
              value={draft?.to ?? ''}
              readOnly={!isPendingDraft || !isEditing}
              onChange={(event) => updateDraft('to', event.target.value)}
              className={fieldClassName}
              style={{borderColor: 'var(--voice-agent-border)'}}
            />
          </label>
          <div className="grid gap-2">
            <span className="text-[11px] font-medium uppercase tracking-[1px] text-[#737373]">
              Type
            </span>
            <div
              className="rounded-[6px] border bg-[#0d0d0d] px-4 py-3 text-[12px] text-white"
              style={{borderColor: 'var(--voice-agent-border)'}}
            >
              {emailTypeLabel}
            </div>
          </div>
        </div>

        <label className="mt-4 grid gap-2">
          <span className="text-[11px] font-medium uppercase tracking-[1px] text-[#737373]">
            Subject
          </span>
          <input
            type="text"
            value={draft?.subject ?? ''}
            readOnly={!isPendingDraft || !isEditing}
            onChange={(event) => updateDraft('subject', event.target.value)}
            className={fieldClassName}
            style={{borderColor: 'var(--voice-agent-border)'}}
          />
        </label>

        {draft && (draft.emailType === 'notification' || draft.link) ? (
          <label className="mt-4 grid gap-2">
            <span className="text-[11px] font-medium uppercase tracking-[1px] text-[#737373]">
              Link
            </span>
            <input
              type="url"
              value={draft.link}
              readOnly={!isPendingDraft || !isEditing}
              onChange={(event) => updateDraft('link', event.target.value)}
              className={fieldClassName}
              style={{borderColor: 'var(--voice-agent-border)'}}
            />
          </label>
        ) : null}

        <label className="mt-4 grid gap-2">
          <span className="text-[11px] font-medium uppercase tracking-[1px] text-[#737373]">
            Message
          </span>
          <textarea
            value={draft?.body ?? ''}
            readOnly={!isPendingDraft || !isEditing}
            onChange={(event) => updateDraft('body', event.target.value)}
            className={`${fieldClassName} min-h-[280px] resize-y`}
            style={{borderColor: 'var(--voice-agent-border)'}}
          />
        </label>

        {validationMessage && isPendingDraft ? (
          <div className="mt-4 rounded-[6px] border border-[#7f1d1d] bg-[#2a1111] px-4 py-3 text-[11px] text-[#fca5a5]">
            {validationMessage}
          </div>
        ) : null}

        {editStubMessage && isPendingDraft ? (
          <div className="mt-4 text-[10px] uppercase tracking-[1px] text-[#f59e0b]">
            {editStubMessage}
          </div>
        ) : null}
      </div>

      {isPendingDraft && onApprove && onCancel ? (
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded-[4px] border px-3 py-2 text-[10px] uppercase tracking-[1px] text-[#a3a3a3] transition-colors hover:text-white"
            style={{borderColor: 'var(--voice-agent-border)', fontFamily: 'var(--font-voice-agent-mono)'}}
          >
            {isEditing ? 'Editing' : request.editLabel}
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
            onClick={handleApprove}
            className="rounded-[4px] px-3 py-2 text-[10px] font-semibold uppercase tracking-[1px] text-white"
            style={{
              backgroundColor: 'var(--voice-agent-live-accent)',
              fontFamily: 'var(--font-voice-agent-mono)',
            }}
          >
            {request.approveLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
