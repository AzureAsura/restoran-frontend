'use client';

import React, { useState } from 'react';
import AdminSidebar from '@/components/shared/AdminSidebar';
import AdminTopbar from '@/components/shared/AdminTopbar';

export const AdminShell = ({ children }: { children: React.ReactNode }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="w-full h-screen max-h-screen bg-[#F9F9F9] flex text-black overflow-hidden select-none">

      <AdminSidebar
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
      />

      <div
        className={`flex-1 h-screen max-h-screen flex flex-col overflow-hidden transition-all duration-300 ${
          isCollapsed ? 'md:pl-[70px]' : 'md:pl-[25vw] lg:pl-[260px]'
        }`}
      >

        <AdminTopbar onMenuTrigger={() => setIsMobileSidebarOpen(true)} />

        <main className="flex-1 p-[6vw] md:p-[1.5vw] w-full max-w-full overflow-y-auto">
          {children}
        </main>

      </div>

    </div>
  );
};

export default AdminShell;
