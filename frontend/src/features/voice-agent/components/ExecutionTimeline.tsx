import {ApprovalRequest, TimelineStep} from '../types/voiceAgent.types';
import {voiceAgentLayoutTokens} from '../utils/voiceAgentLayoutTokens';
import {ApprovalCard} from './ApprovalCard';
import {ExecutionTimelineItem} from './ExecutionTimelineItem';

export function ExecutionTimeline({
  jobId,
  steps,
  approvalRequest,
  editStubMessage,
  onApprove,
  onEdit,
  onCancel,
}: {
  jobId: string;
  steps: TimelineStep[];
  approvalRequest: ApprovalRequest | null;
  editStubMessage: string | null;
  onApprove: () => void;
  onEdit: () => void;
  onCancel: () => void;
}) {
  return (
    <section className="flex min-h-[360px] flex-col bg-[var(--voice-agent-center-shell)]">
      <div
        className="flex items-center justify-between border-b px-4 pb-[17px] pt-4"
        style={{borderColor: 'var(--voice-agent-border)'}}
      >
        <span className="text-[10.7px] font-medium uppercase tracking-[1.1px] text-[#737373]">
          Execution Timeline
        </span>
        <span
          className="text-[11px] text-[#525252]"
          style={{fontFamily: 'var(--font-voice-agent-mono)'}}
        >
          {jobId}
        </span>
      </div>

      <div
        className="relative flex-1 overflow-auto"
        style={{padding: voiceAgentLayoutTokens.timelinePadding}}
      >
        <div
          className="absolute bottom-0 top-0 w-px"
          style={{left: voiceAgentLayoutTokens.timelinePadding + 19, backgroundColor: 'var(--voice-agent-border)'}}
        />

        {steps.length === 0 ? (
          <div className="relative flex h-full min-h-[240px] items-center pl-16">
            <div>
              <div className="text-[13px] font-semibold text-white">Awaiting command stream</div>
              <div className="mt-2 text-[11px] text-[#737373]">
                Activate the orb to start listening, then the execution timeline will populate incrementally.
              </div>
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col gap-8">
            {steps.map((step) => (
              <ExecutionTimelineItem key={step.id} step={step}>
                {approvalRequest && step.status === 'waiting_approval' ? (
                  <ApprovalCard
                    request={approvalRequest}
                    editStubMessage={editStubMessage}
                    onApprove={onApprove}
                    onEdit={onEdit}
                    onCancel={onCancel}
                  />
                ) : null}
              </ExecutionTimelineItem>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
