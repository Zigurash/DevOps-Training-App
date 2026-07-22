import { cn } from '@/lib/utils';
import type { PropsWithChildren, ReactNode } from 'react';

export function Card({
  className,
  children,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        'rounded-xl border border-surface-border bg-surface-raised/90 shadow-panel backdrop-blur',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-surface-border px-4 py-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-xs text-slate-400">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function CardBody({
  className,
  children,
}: PropsWithChildren<{ className?: string }>) {
  return <div className={cn('p-4', className)}>{children}</div>;
}
