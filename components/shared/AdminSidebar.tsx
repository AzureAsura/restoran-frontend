'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  Grid3X3,
  MonitorCheck,
  ChefHat,
  UtensilsCrossed,
  Wallet,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useSession } from '@/hooks/use-session';
import { getAdminRouteRoles } from '@/lib/admin-routes';

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const allNavLinks = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Bookings', href: '/admin/bookings', icon: CalendarDays },
  { name: 'Tables Management', href: '/admin/tables', icon: Grid3X3 },
  { name: 'Point of Sale (POS)', href: '/admin/pos', icon: MonitorCheck },
  { name: 'Kitchen Monitor', href: '/admin/kitchen', icon: ChefHat },
  { name: 'Menu Editor', href: '/admin/menu', icon: UtensilsCrossed },
  { name: 'Finance', href: '/admin/finance', icon: Wallet },
];

export const AdminSidebar = ({ isMobileOpen, onMobileClose, isCollapsed, onToggleCollapse }: SidebarProps) => {
  const { data: session } = useSession();
  const role = session?.user.role;
  const pathname = usePathname();

  const filteredLinks = role
    ? allNavLinks.filter(link => getAdminRouteRoles(link.href)?.includes(role))
    : [];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* ================= DESKTOP SIDEBAR (collapsible) ================= */}
      <aside
        className={`hidden md:flex flex-col h-screen fixed top-0 left-0 bg-white border-r border-black/5 z-30 justify-between transition-all duration-300 ${
          isCollapsed ? 'md:w-[70px] lg:w-[70px] p-3' : 'md:w-[25vw] lg:w-[260px] p-[1.5vw]'
        }`}
      >
        <div className="flex flex-col gap-[2.5vw]">
          <div className={`flex flex-col ${isCollapsed ? 'items-center' : ''}`}>
            {!isCollapsed ? (
              <>
                <span className="text-[0.6vw] font-bold text-black/40 uppercase tracking-widest">Management</span>
                <span className="text-[1.3vw] font-bold text-black uppercase tracking-tighter leading-none mt-[0.2vw]">
                  Megatha Control
                </span>
              </>
            ) : (
              <span className="font-bold text-black uppercase text-lg">M</span>
            )}
          </div>

          <nav className="flex flex-col gap-[0.4vw]">
            {filteredLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                title={isCollapsed ? link.name : undefined}
                className={`flex items-center font-bold uppercase tracking-tight transition-colors ${
                  isActive(link.href)
                    ? 'text-black bg-black/[0.04] border-l-2 border-black'
                    : 'text-black/50 hover:text-black hover:bg-black/[0.02] border-l-2 border-transparent'
                } ${
                  isCollapsed ? 'justify-center px-0 py-3' : 'gap-[0.8vw] px-[1vw] py-[0.7vw] text-[0.9vw]'
                }`}
              >
                <link.icon className="w-[1.1vw] h-[1.1vw] stroke-[2] shrink-0" />
                {!isCollapsed && link.name}
              </a>
            ))}
          </nav>
        </div>

        {!isCollapsed && (
          <div className="border-t border-black/5 pt-[1vw]">
            <span className="text-[0.55vw] font-bold text-black/30 uppercase tracking-widest">Signed in as:</span>
            <div className="text-[0.8vw] font-bold text-[#6E3A2F] uppercase mt-[0.3vw]">
              {role ?? '...'}
            </div>
          </div>
        )}

        {/* Tombol collapse — nempel di tepi kanan sidebar, desktop only */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex absolute top-6 -right-3 w-6 h-6 items-center justify-center rounded-full bg-white border border-black/10 shadow-sm text-black/60 hover:text-black hover:border-black/30 transition-colors z-40"
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </aside>

      {/* ================= MOBILE SIDEBAR DRAWER ================= */}
      <div className={`fixed inset-0 bg-black/40 z-50 md:hidden transition-opacity duration-300 ${isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <aside className={`w-[260px] h-full bg-white p-[6vw] flex flex-col justify-between transform transition-transform duration-500 cubic-bezier(0.2, 1, 0.3, 1) ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex flex-col gap-[8vw]">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[2.5vw] font-bold text-black/40 uppercase tracking-widest">Management</span>
                <span className="text-[5vw] font-bold text-black uppercase tracking-tighter leading-none mt-[0.2vw]">Megatha</span>
              </div>
              <button onClick={onMobileClose} className="text-black">
                <X className="w-[6vw] h-[6vw]" />
              </button>
            </div>

            <nav className="flex flex-col gap-[2vw]">
              {filteredLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={onMobileClose}
                  className={`flex items-center gap-[3vw] py-[2vw] text-[4vw] font-bold uppercase transition-colors ${
                    isActive(link.href) ? 'text-black' : 'text-black/50'
                  }`}
                >
                  <link.icon className="w-[5vw] h-[5vw]" />
                  {link.name}
                </a>
              ))}
            </nav>
          </div>
          
          <div className="border-t border-black/5 pt-[4vw]">
            <span className="text-[2.5vw] font-bold text-black/30 uppercase tracking-widest">Active Role</span>
            <div className="text-[3.8vw] font-bold text-[#6E3A2F] uppercase mt-[1vw]">{role ?? '...'}</div>
          </div>
        </aside>
      </div>
    </>
  );
};

export default AdminSidebar;