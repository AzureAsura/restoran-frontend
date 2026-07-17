'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User, LogOut, Menu } from 'lucide-react';
import { signOut } from '@/lib/auth-client';
import { useSession } from '@/hooks/use-session';

interface TopbarProps {
  onMenuTrigger: () => void;
}

export const AdminTopbar = ({ onMenuTrigger }: TopbarProps) => {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const signOutMutation = useMutation({
    mutationFn: signOut,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['session'] });
      router.push('/admin/login');
    },
  });

  return (
    <header className="w-full h-[16vw] md:h-[4.5vw] bg-white border-b border-black/5 px-[6vw] md:px-[2.5vw] flex items-center justify-between sticky top-0 z-20">
      

      <div className="flex items-center gap-[4vw] md:gap-[1vw]">
        <button 
          onClick={onMenuTrigger}
          className="md:hidden text-black p-[1vw] focus:outline-none"
        >
          <Menu className="w-[6vw] h-[6vw]" />
        </button>
        <span className="text-[4.5vw] md:text-[1.1vw] font-bold uppercase tracking-tight text-black">
          Megatha Restaurant
        </span>
      </div>

      <div className="relative flex items-center">
        <button 
          onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
          className="flex items-center gap-[2vw] md:gap-[0.5vw] border-l border-black/5 pl-[4vw] md:pl-[1.5vw] h-[8vw] md:h-[2vw] group focus:outline-none"
        >
          <div className="w-[8vw] h-[8vw] md:w-[2vw] md:h-[2vw] bg-black text-white flex items-center justify-center rounded-none">
            <User className="w-[4vw] h-[4vw] md:w-[1vw] md:h-[1vw]" />
          </div>
          <span className="hidden md:inline text-[0.9vw] font-bold uppercase text-black tracking-tight group-hover:text-black/60 transition-colors">
            {session?.user.name ?? '...'}
          </span>
        </button>

        {isProfileDropdownOpen && (
          <div className="absolute right-0 top-[14vw] md:top-[3.5vw] w-[45vw] md:w-[12vw] bg-white border border-black/10 shadow-xl flex flex-col rounded-none overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <button
              type="button"
              onClick={() => signOutMutation.mutate()}
              disabled={signOutMutation.isPending}
              className="w-full text-left px-[4vw] py-[3vw] md:px-[1.2vw] md:py-[0.8vw] text-[3.5vw] md:text-[0.85vw] font-bold uppercase text-red-600 hover:bg-red-50 flex items-center gap-[2vw] md:gap-[0.5vw] transition-colors disabled:opacity-50"
            >
              <LogOut className="w-[4vw] h-[4vw] md:w-[1vw] md:h-[1vw]" />
              {signOutMutation.isPending ? 'Logging out...' : 'Logout Terminal'}
            </button>
          </div>
        )}
      </div>

    </header>
  );
};

export default AdminTopbar;