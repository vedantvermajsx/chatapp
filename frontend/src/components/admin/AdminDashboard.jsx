import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import OverviewPage from './pages/OverviewPage';
import UsersPage from './pages/UsersPage';
import GuestsPage from './pages/GuestsPage';
import RoomsPage from './pages/RoomsPage';
import ReportsPage from './pages/ReportsPage';
import BansPage from './pages/BansPage';

export default function AdminDashboard() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<OverviewPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="guests" element={<GuestsPage />} />
        <Route path="rooms" element={<RoomsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="bans" element={<BansPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}
