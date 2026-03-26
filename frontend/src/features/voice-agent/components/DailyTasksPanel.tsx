export function DailyTasksPanel({tasks}: {tasks: string[]}) {
  if (tasks.length === 0) {
    return null;
  }

  return (
    <section
      className="border-t"
      style={{borderColor: 'var(--voice-agent-border)'}}
    >
      <div
        className="border-b px-4 pb-[17px] pt-4"
        style={{borderColor: 'var(--voice-agent-border)'}}
      >
        <span className="text-[10.3px] font-medium uppercase tracking-[1.1px] text-[#737373]">
          Daily Tasks
        </span>
      </div>

      <div className="flex flex-col gap-3 bg-black p-4">
        {tasks.map((task, index) => (
          <article
            key={`${task}-${index}`}
            className="rounded-[4px] border bg-[#111111] p-[14px]"
            style={{borderColor: 'var(--voice-agent-border)'}}
          >
            <div className="text-[9.2px] uppercase text-[#737373]">Task {index + 1}</div>
            <div className="mt-1 text-[11px] text-[#d4d4d4]">{task}</div>
          </article>
        ))}
      </div>
    </section>
  );
}
