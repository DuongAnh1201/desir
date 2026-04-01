export const EMAIL_CAPABILITY_ID = 'send_email';

export function hasPendingApproval(state) {
  return state.uiState === 'waiting_approval' || Boolean(state.approvalRequest);
}

export function shouldIgnoreSpeakingState(state, speaking) {
  return !speaking && hasPendingApproval(state);
}

export function shouldIgnoreCompletedState(state) {
  return hasPendingApproval(state);
}

function truncate(value, maxLength = 44) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) {
    return '';
  }

  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 3)}...` : trimmed;
}

export function approvalDecisionToDraftStatus(decision) {
  if (decision === 'approved') {
    return 'approved';
  }

  if (decision === 'cancelled') {
    return 'rejected';
  }

  return 'pending';
}

export function applyDraftOverrideToRequest(request, draft) {
  if (!request || !draft) {
    return request;
  }

  return {
    ...request,
    preview: {
      to: draft.to,
      subject: draft.subject,
      body: draft.body,
      emailType: draft.emailType,
      link: draft.link ?? null,
    },
    summary: draft.to
      ? `Outgoing email to ${draft.to}`
      : request.summary,
  };
}

export function formatEmailDraftMetricValue(request) {
  const subject = truncate(request?.preview?.subject ?? '');
  const recipient = truncate(request?.preview?.to ?? '', 30);

  if (subject && recipient) {
    return `${subject} -> ${recipient}`;
  }

  if (subject) {
    return subject;
  }

  if (recipient) {
    return `Draft for ${recipient}`;
  }

  return 'Draft ready for review';
}

export function upsertEmailDraftCapability(capabilities, request, draftStatus) {
  if (!request) {
    return capabilities;
  }

  const capability = {
    id: EMAIL_CAPABILITY_ID,
    title: 'Email',
    icon: 'mail',
    status:
      draftStatus === 'pending'
        ? 'active'
        : draftStatus === 'approved'
          ? 'connected'
          : 'degraded',
    metricLabel: draftStatus === 'pending' ? 'Draft Ready' : 'Latest Draft',
    metricValue: formatEmailDraftMetricValue(request),
    connectionLabel:
      draftStatus === 'pending'
        ? 'PENDING'
        : draftStatus === 'approved'
          ? 'APPROVED'
          : 'REJECTED',
    isInteractive: true,
    statusLabel:
      draftStatus === 'pending'
        ? 'Pending Approval'
        : draftStatus === 'approved'
          ? 'Approved'
          : 'Rejected',
  };

  const existingIndex = capabilities.findIndex((entry) => entry.id === EMAIL_CAPABILITY_ID);
  if (existingIndex === -1) {
    return [capability, ...capabilities];
  }

  const nextCapabilities = [...capabilities];
  nextCapabilities[existingIndex] = {
    ...nextCapabilities[existingIndex],
    ...capability,
  };
  return nextCapabilities;
}
