import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createApprovalTimelineStep,
  upsertApprovalTimeline,
} from '../src/features/voice-agent/utils/approvalTimeline.js';

const firstRequest = {
  id: 'call-1',
  toolName: 'send_email',
  title: 'Voice Email Review',
  summary: 'Outgoing email to tom@example.com',
  preview: {
    to: 'tom@example.com',
    subject: 'First subject',
    body: 'First body',
    emailType: 'user_request',
  },
};

const revisedRequest = {
  id: 'call-2',
  toolName: 'send_email',
  title: 'Voice Email Review',
  summary: 'Outgoing email to sam@example.com',
  preview: {
    to: 'sam@example.com',
    subject: 'Updated subject',
    body: 'Updated body',
    emailType: 'user_request',
  },
};

const listeningStep = {
  id: 'listen',
  title: 'Listening to user intent',
  subtitle: 'Realtime capture: active',
  icon: 'mic',
  status: 'active',
  badgeLabel: 'LISTENING',
};

test('first approval request adds a single waiting approval step', () => {
  const timeline = upsertApprovalTimeline([listeningStep], firstRequest);

  assert.equal(timeline.timelineSteps.length, 2);
  assert.deepEqual(timeline.timelineSteps[0], {
    ...listeningStep,
    status: 'completed',
    badgeLabel: 'COMPLETED',
  });
  assert.equal(timeline.timelineSteps[1].status, 'waiting_approval');
  assert.equal(timeline.timelineSteps[1].title, firstRequest.title);
  assert.equal(timeline.timelineSteps[1].subtitle, firstRequest.summary);
  assert.equal(timeline.activeStepIndex, 1);
});

test('revised approval request replaces the existing waiting approval step in place', () => {
  const initialTimeline = upsertApprovalTimeline([listeningStep], firstRequest);
  const revisedTimeline = upsertApprovalTimeline(initialTimeline.timelineSteps, revisedRequest);

  assert.equal(revisedTimeline.timelineSteps.length, 2);
  assert.equal(revisedTimeline.timelineSteps[0].title, listeningStep.title);
  assert.equal(revisedTimeline.timelineSteps[0].status, 'completed');
  assert.equal(revisedTimeline.timelineSteps[1].status, 'waiting_approval');
  assert.equal(revisedTimeline.timelineSteps[1].id, 'call-2-approval');
  assert.equal(revisedTimeline.timelineSteps[1].subtitle, revisedRequest.summary);
  assert.equal(revisedTimeline.activeStepIndex, 1);
});

test('duplicate waiting approval steps collapse to the latest request', () => {
  const duplicateTimeline = [
    {
      ...listeningStep,
      status: 'completed',
      badgeLabel: 'COMPLETED',
    },
    createApprovalTimelineStep(firstRequest),
    {
      ...createApprovalTimelineStep({
        ...firstRequest,
        id: 'call-duplicate',
      }),
      subtitle: 'Stale approval entry',
    },
  ];

  const normalizedTimeline = upsertApprovalTimeline(duplicateTimeline, revisedRequest);
  const waitingSteps = normalizedTimeline.timelineSteps.filter(
    (step) => step.status === 'waiting_approval',
  );

  assert.equal(normalizedTimeline.timelineSteps.length, 2);
  assert.equal(waitingSteps.length, 1);
  assert.equal(waitingSteps[0].id, 'call-2-approval');
  assert.equal(waitingSteps[0].subtitle, revisedRequest.summary);
  assert.equal(normalizedTimeline.activeStepIndex, 1);
});

test('stale completed approval steps are replaced by the live pending approval', () => {
  const staleCompletedApproval = {
    ...createApprovalTimelineStep(firstRequest),
    status: 'completed',
    badgeLabel: 'COMPLETED',
  };

  const normalizedTimeline = upsertApprovalTimeline(
    [
      {
        ...listeningStep,
        status: 'completed',
        badgeLabel: 'COMPLETED',
      },
      staleCompletedApproval,
    ],
    revisedRequest,
  );

  assert.equal(normalizedTimeline.timelineSteps.length, 2);
  assert.equal(normalizedTimeline.timelineSteps[0].title, listeningStep.title);
  assert.equal(normalizedTimeline.timelineSteps[1].status, 'waiting_approval');
  assert.equal(normalizedTimeline.timelineSteps[1].id, 'call-2-approval');
  assert.equal(normalizedTimeline.activeStepIndex, 1);
});
