import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useRouter } from '../../context/RouterContext.tsx';
import { ADMIN_LOGIN_PATH } from '../../config/adminRoute.js';
import { renderAdminDashboardPage } from '../../vanilla/pages/admin/adminDashboard.js';

export const AdminDashboardPage: React.FC = () => {
  const { isAdmin, isPresident, isLoading } = useAuth();
  const { navigate } = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !isAdmin && !isPresident) {
      navigate(ADMIN_LOGIN_PATH);
      return;
    }

    if (containerRef.current) {
      containerRef.current.innerHTML = renderAdminDashboardPage();
    }
  }, [isAdmin, isPresident, isLoading, navigate]);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#F7EFE8] dark:bg-[#071A14] font-sans text-[#282828] dark:text-white selection:bg-[#FC6454]/25 selection:text-[#282828] dark:selection:bg-[#2F8068]/35 dark:selection:text-[#F1F7F4]"
    />
  );
};

export default AdminDashboardPage;
