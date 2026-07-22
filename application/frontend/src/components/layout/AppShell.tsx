import { NavLink } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Database,
  Gauge,
  LayoutDashboard,
  Menu,
  Server,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { failureApi, healthApi } from '@/services/api';
import { Badge } from '@/components/ui/Badge';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/records', label: 'Records', icon: Database },
  { to: '/load-lab', label: 'Load Lab', icon: Gauge },
  { to: '/failure-lab', label: 'Failure Lab', icon: AlertTriangle },
  { to: '/events', label: 'Events', icon: Activity },
  { to: '/system', label: 'System', icon: Server },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const health = useQuery({
    queryKey: ['health'],
    queryFn: healthApi.check,
    refetchInterval: 5000,
  });
  const failure = useQuery({
    queryKey: ['failure-status'],
    queryFn: failureApi.status,
    refetchInterval: 3000,
  });

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 border-r border-surface-border bg-surface-raised/95 p-4 backdrop-blur transition lg:static lg:w-auto lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-accent">
              Realworld
            </div>
            <div className="mt-1 text-lg font-semibold leading-tight">
              Infrastructure Lab
            </div>
          </div>
          <button className="lg:hidden" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition hover:bg-surface-overlay hover:text-white',
                  isActive && 'bg-accent/15 text-white ring-1 ring-accent/30',
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-8 rounded-lg border border-surface-border bg-surface p-3 text-xs text-slate-400">
          <div className="mb-2 font-medium text-slate-200">Lab status</div>
          <div className="space-y-1.5">
            <div>
              App:{' '}
              <span className="text-slate-200">
                {health.data?.status ?? '…'}
              </span>
            </div>
            <div>
              DB:{' '}
              <span className="text-slate-200">
                {health.data?.database.status ?? '…'}
              </span>
            </div>
            <div className="truncate">
              Host:{' '}
              <span className="font-mono text-slate-200">
                {health.data?.hostname ?? '…'}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {open ? (
        <button
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        />
      ) : null}

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-surface-border bg-surface/80 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <div className="text-sm font-semibold">Engineering Console</div>
              <div className="text-xs text-slate-400">
                Observability · Load · Failure simulation
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {failure.data?.anyActive ? (
              <Badge tone="warning">Failure simulation active</Badge>
            ) : (
              <Badge tone="success">Nominal</Badge>
            )}
            <Badge tone="info">v{health.data?.version ?? '1.0.0'}</Badge>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
