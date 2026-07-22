import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { RecordsPage } from '@/features/records/RecordsPage';
import { LoadLabPage } from '@/features/load-testing/LoadLabPage';
import { FailureLabPage } from '@/features/failure/FailureLabPage';
import { EventsPage } from '@/features/events/EventsPage';
import { SystemPage } from '@/features/system/SystemPage';

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/records" element={<RecordsPage />} />
        <Route path="/load-lab" element={<LoadLabPage />} />
        <Route path="/failure-lab" element={<FailureLabPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/system" element={<SystemPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
