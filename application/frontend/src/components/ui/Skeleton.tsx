import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-surface-overlay/80',
        className,
      )}
    />
  );
}

export function StatusDot({
  ok,
  label,
}: {
  ok: boolean;
  label?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span
        className={cn(
          'h-2.5 w-2.5 rounded-full',
          ok ? 'bg-success shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-danger',
        )}
      />
      {label}
    </span>
  );
}
