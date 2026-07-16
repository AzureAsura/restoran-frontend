'use client';

import React, { useState } from 'react';
import { Menu, X, Shield } from 'lucide-react';

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Menu', href: '/menu' },
    { name: 'Reservations', href: '/booking' },
    { name: 'Terminal', href: '/admin/login' },
  ];

  return (
    <>
      <nav className="w-full fixed top-0 left-0 z-50 bg-canvas/80 backdrop-blur-xl border-b border-black/5 px-[6vw] md:px-[4vw] py-[4vw] md:py-[1.5vw] flex items-center justify-between transition-all duration-300">
        
        <a href="/" className="flex flex-col group select-none">
          <span className="text-[5vw] md:text-[1.5vw] font-bold tracking-tighter uppercase text-black leading-[0.9]">
            Megatha
          </span>
          <span className="text-[2vw] md:text-[0.6vw] text-black/40 uppercase tracking-widest mt-[0.2vw]">
            Fine Dining
          </span>
        </a>

        <div className="hidden md:flex items-center gap-[3vw]">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-[0.95vw] font-bold uppercase text-black/60 hover:text-black tracking-tight transition-colors duration-200 relative group"
            >
              {link.name}
              <span className="absolute bottom-[-0.2vw] left-0 w-0 h-[1px] bg-black transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center">
          <a
            href="/booking"
            className="bg-[#6E3A2F] text-white text-[0.9vw] font-bold uppercase tracking-widest px-[2vw] py-[0.8vw] hover:bg-[#542c23] transition-colors duration-300 rounded-none shadow-md shadow-black/[0.05]"
          >
            Book a Table
          </a>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex md:hidden text-black focus:outline-none p-[1vw]"
        >
          {isMobileMenuOpen ? (
            <X className="w-[6vw] h-[6vw] stroke-[2]" />
          ) : (
            <Menu className="w-[6vw] h-[6vw] stroke-[2]" />
          )}
        </button>

      </nav>

      <div
        className={`fixed inset-y-0 right-0 z-40 w-full bg-canvas border-l border-black/5 p-[8vw] pt-[24vw] flex flex-col justify-between transform transition-transform duration-500 cubic-bezier(0.2, 1, 0.3, 1) md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-[6vw] mt-[4vw]">
          <span className="text-[3vw] font-medium tracking-[0.2em] text-black/40 uppercase border-b border-black/5 pb-[2vw]">
            Navigation
          </span>
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-[8vw] font-bold uppercase text-black tracking-tight leading-[1.1]"
            >
              {link.name}
            </a>
          ))}
        </div>

        <div className="flex flex-col gap-[4vw] w-full">
          <a
            href="/booking"
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full bg-[#6E3A2F] text-white text-[4vw] font-bold uppercase tracking-widest text-center py-[4vw] rounded-none"
          >
            Book a Table
          </a>
          
          <div className="flex justify-between items-center border-t border-black/5 pt-[4vw] text-[2.8vw] text-black/40 uppercase tracking-wider">
            <span>© 2026 Megatha</span>
            <span className="flex items-center gap-[1vw]">
              <Shield className="w-[3.5vw] h-[3.5vw]" /> Secure Portal
            </span>
          </div>
        </div>

      </div>
    </>
  );
};

export default Navbar;