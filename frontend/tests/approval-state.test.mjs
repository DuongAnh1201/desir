import test from 'node:test';
import assert from 'node:assert/strict';
import {
  approvalDecisionToDraftStatus,
  formatEmailDraftMetricValue,
  hasPendingApproval,
  shouldIgnoreCompletedState,
  shouldIgnoreSpeakingState,
  upsertEmailDraftCapability,
} from '../src/features/voice-agent/utils/approvalState.js';

const approvalRequest = {
  id: 'call-123',
  toolName: 'send_email',
  title: 'Approve Email Draft',
  summary: 'Outgoing email to tom@example.com',
  preview: {
    to: 'tom@example.com',
    subject: 'Not Feeling Well',
    body: 'Hi Tom, I need to rest today.',
    emailType: 'user_request',
  },
};

test('preserves approval state when speaking=false arrives after approval is requested', () => {
  const state = {
    uiState: 'waiting_approval',
    approvalRequest,
  };

  assert.equal(hasPendingApproval(state), true);
  assert.equal(shouldIgnoreSpeakingState(state, false), true);
});

test('preserves approval state when a completed event arrives during approval', () => {
  const state = {
    uiState: 'listening',
    approvalRequest,
  };

  assert.equal(hasPendingApproval(state), true);
  assert.equal(shouldIgnoreCompletedState(state), true);
});

test('does not block normal idle handling when no approval is pending', () => {
  const state = {
    uiState: 'listening',
    approvalRequest: null,
  };

  assert.equal(hasPendingApproval(state), false);
  assert.equal(shouldIgnoreSpeakingState(state, false), false);
  assert.equal(shouldIgnoreCompletedState(state), false);
});

test('creates an interactive email capability as soon as a draft exists', () => {
  const capabilities = upsertEmailDraftCapability([], approvalRequest, 'pending');

  assert.equal(capabilities.length, 1);
  assert.equal(capabilities[0].id, 'send_email');
  assert.equal(capabilities[0].status, 'active');
  assert.equal(capabilities[0].connectionLabel, 'PENDING');
  assert.equal(capabilities[0].isInteractive, true);
  assert.equal(capabilities[0].statusLabel, 'Pending Approval');
});

test('keeps the latest email draft capability after approval', () => {
  const pendingCapabilities = upsertEmailDraftCapability([], approvalRequest, 'pending');
  const approvedCapabilities = upsertEmailDraftCapability(
    pendingCapabilities,
    approvalRequest,
    approvalDecisionToDraftStatus('approved'),
  );

  assert.equal(approvedCapabilities[0].status, 'connected');
  assert.equal(approvedCapabilities[0].connectionLabel, 'APPROVED');
  assert.equal(approvedCapabilities[0].statusLabel, 'Approved');
  assert.equal(
    formatEmailDraftMetricValue(approvalRequest),
    'Not Feeling Well -> tom@example.com',
  );
});
