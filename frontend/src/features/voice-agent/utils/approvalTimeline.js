function badgeLabelForStatus(status) {
  switch (status) {
    case 'completed':
      return 'COMPLETED';
    case 'waiting_approval':
      return 'PENDING';
    default:
      return 'PENDING';
  }
}

export function createApprovalTimelineStep(request) {
  return {
    id: `${request.id}-approval`,
    title: request.title,
    subtitle: request.summary,
    icon: 'lock',
    status: 'waiting_approval',
    badgeLabel: badgeLabelForStatus('waiting_approval'),
  };
}

function isApprovalTimelineStep(step) {
  return (
    step.icon === 'lock' &&
    (step.status === 'waiting_approval' ||
      step.id.endsWith('-approval') ||
      step.id.endsWith('-approval-fallback'))
  );
}

function markStepCompleted(step) {
  if (step.status === 'completed') {
    return step;
  }

  return {
    ...step,
    status: 'completed',
    badgeLabel: badgeLabelForStatus('completed'),
  };
}

export function upsertApprovalTimeline(steps, request) {
  const approvalStep = createApprovalTimelineStep(request);
  const normalizedSteps = [];
  let approvalStepIndex = -1;

  steps.forEach((step) => {
    if (isApprovalTimelineStep(step)) {
      if (approvalStepIndex === -1) {
        approvalStepIndex = normalizedSteps.length;
        normalizedSteps.push(approvalStep);
      }
      return;
    }

    normalizedSteps.push(markStepCompleted(step));
  });

  if (approvalStepIndex === -1) {
    approvalStepIndex = normalizedSteps.length;
    normalizedSteps.push(approvalStep);
  }

  return {
    timelineSteps: normalizedSteps,
    activeStepIndex: approvalStepIndex,
  };
}
