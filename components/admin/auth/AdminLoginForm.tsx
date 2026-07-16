'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { signIn, AuthError } from '@/lib/auth-client';
import { ROLE_LANDING_PAGE } from '@/lib/role-landing';

export const AdminLoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const queryClient = useQueryClient();

  const signInMutation = useMutation({
    mutationFn: () => signIn(email, password),
    onSuccess: async ({ user }) => {
      await queryClient.invalidateQueries({ queryKey: ['session'] });
      router.push(ROLE_LANDING_PAGE[user.role] ?? '/admin/tables');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signInMutation.reset();
    signInMutation.mutate();
  };

  const errorMessage = signInMutation.isError
    ? signInMutation.error instanceof AuthError
      ? signInMutation.error.message
      : 'Gagal login, coba lagi.'
    : null;

  return (

    <main className="w-full bg-canvas min-h-screen flex flex-col justify-center md:grid md:grid-cols-12 items-center section-pad pt-[12vw] pb-[12vw] md:pt-0 md:pb-0 gap-[10vw] md:gap-0">


      <div className="w-full md:col-span-5 flex flex-col items-center text-center md:items-start md:text-left gap-[4vw] md:gap-[2vw] justify-center h-full border-b border-black/5 pb-[8vw] md:pb-0 md:border-b-0 md:border-r md:border-black/5 md:pr-[4vw]">
        <div className="flex flex-col gap-[1vw]">
          <span className="text-[3.5vw] md:text-[0.85vw] font-medium tracking-[0.2em] text-black/40 uppercase">
            Staff Portal
          </span>
          <h1 className="text-[12vw] md:text-[4vw] font-bold tracking-tight text-black uppercase leading-[0.9]">
            Megatha
          </h1>
        </div>

        <p className="text-[3.8vw] md:text-[1.05vw] font-medium text-black/50 uppercase tracking-tight leading-[1.4] max-w-[85%] md:max-w-[90%]">
          SISTEM MANAJEMEN INTERNAL RESERVASI, POINT OF SALE, DAN MONITORING DAPUR UTAMA. HARAP JAGA KERAHASIAAN KREDENSIAL AKSES ANDA.
        </p>

        {/* <p className="text-[3.8vw] md:text-[1.05vw] font-medium text-black/50 uppercase tracking-tight leading-[1.4] max-w-[85%] md:max-w-[90%]">
          Owner: owner@warungbagas.id / Owner#12345
        </p>
        <p className="text-[3.8vw] md:text-[1.05vw] font-medium text-black/50 uppercase tracking-tight leading-[1.4] max-w-[85%] md:max-w-[90%]">
          Cashier: cashier@warungbagas.id / Cashier#12345
        </p>
        <p className="text-[3.8vw] md:text-[1.05vw] font-medium text-black/50 uppercase tracking-tight leading-[1.4] max-w-[85%] md:max-w-[90%]">
          Kitchen: kitchen@warungbagas.id / Kitchen#12345
        </p> */}

      </div>


      <div className="w-full md:col-span-7 flex flex-col justify-center h-full md:pl-[6vw]">
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-[6vw] md:gap-[3.5vw]">

          <div className="flex flex-col gap-[1.5vw] md:gap-[0.5vw] w-full">
            <label className="text-[3vw] md:text-[0.8vw] font-bold uppercase tracking-wider text-black text-center md:text-left">
              Email Staf
            </label>
            <input
              type="email"
              placeholder="CONTOH: OWNER@THEFJORDS.COM"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required

              className="w-full bg-transparent border-b border-black/20 focus:border-black pb-[1vw] md:pb-[0.8vw] text-[4vw] md:text-[1.1vw] font-medium text-black placeholder:text-black/20 focus:outline-none tracking-wide text-center md:text-left transition-colors"
            />
          </div>


          <div className="flex flex-col gap-[1.5vw] md:gap-[0.5vw] w-full relative">
            <label className="text-[3vw] md:text-[0.8vw] font-bold uppercase tracking-wider text-black text-center md:text-left">
              Kata Sandi
            </label>
            <div className="w-full flex items-center relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required

                className="w-full bg-transparent border-b border-black/20 focus:border-black pb-[1vw] md:pb-[0.8vw] pr-0 md:pr-[2.5vw] text-[4vw] md:text-[1.1vw] font-medium text-black placeholder:text-black/20 focus:outline-none tracking-wide text-center md:text-left transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}

                className="absolute right-0 bottom-[1vw] md:bottom-[0.8vw] text-black/40 hover:text-black transition-colors z-10 p-[1vw] md:p-0"
              >
                {showPassword ? (
                  <EyeOff className="w-[4.5vw] h-[4.5vw] md:w-[1.1vw] md:h-[1.1vw]" />
                ) : (
                  <Eye className="w-[4.5vw] h-[4.5vw] md:w-[1.1vw] md:h-[1.1vw]" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={signInMutation.isPending}
            className="w-full bg-black text-white text-[4vw] md:text-[1.1vw] font-bold uppercase tracking-widest py-[4vw] md:py-[1.2vw] flex items-center justify-center gap-[2vw] md:gap-[0.8vw] hover:bg-black/80 transition-colors duration-300 rounded-none shadow-lg shadow-black/[0.02] mt-[2vw] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShieldCheck className="w-[4.5vw] h-[4.5vw] md:w-[1.2vw] md:h-[1.2vw]" />
            {signInMutation.isPending ? 'Memverifikasi...' : 'Authorize & Enter Terminal'}
          </button>

          {errorMessage && (
            <p className="flex items-center justify-center md:justify-start gap-[1.5vw] md:gap-[0.5vw] text-[3.2vw] md:text-[0.85vw] font-bold uppercase tracking-wide text-red-600">
              <AlertCircle className="w-[4vw] h-[4vw] md:w-[1vw] md:h-[1vw] shrink-0" />
              {errorMessage}
            </p>
          )}

        </form>
      </div>

    </main>
  );
};

export default AdminLoginForm;