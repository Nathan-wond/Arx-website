import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useRouter } from '../../context/RouterContext.tsx';
import { PRESIDENT_LOGIN_PATH, ADMIN_DASHBOARD_PATH } from '../../config/adminRoute.js';
import {
  renderPresidentDashboardPage,
  initPresidentDashboardPageEvents
} from '../../vanilla/pages/president/presidentDashboard.js';

export const PresidentDashboardPage: React.FC = () => {
  const { isPresident, isAdmin, isLoading } = useAuth();
  const { navigate } = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isPresident) {
        if (isAdmin) {
          navigate(ADMIN_DASHBOARD_PATH);
        } else {
          navigate(PRESIDENT_LOGIN_PATH);
        }
        return;
      }
    }

    const container = document.getElementById('president-dashboard-container');
    if (container) {
      container.innerHTML = renderPresidentDashboardPage();
      initPresidentDashboardPageEvents();
    }
  }, [isPresident, isAdmin, isLoading, navigate]);

  return (
    <div
      id="president-dashboard-container"
      className="min-h-screen bg-[var(--bg)] font-sans text-[var(--text)] selection:bg-amber-500/25 selection:text-amber-900"
    />
  );
};

export default PresidentDashboardPage;
