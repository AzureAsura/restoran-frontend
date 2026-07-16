'use client';

import React from 'react';
import { Play } from 'lucide-react';
import ScrollReveal from '@/components/ui/ScrollReveal';

const Testimonials = () => {
    return (
        <section className="w-full bg-canvas flex flex-col">

            <div className="w-full section-pad py-[4vw] flex flex-col items-center justify-center">

                <span className="text-[3vw] md:text-[0.85vw] font-medium tracking-[0.2em] text-black/40 uppercase md:mb-[1vw]">
                    Our Philosophy
                </span>

                <ScrollReveal
                    containerClassName="max-w-[95%] md:max-w-[85%] lg:max-w-[70%] mx-auto"
                    textClassName="text-black font-semibold uppercase tracking-tight text-center leading-[1.1] md:leading-[1.2]"
                >
                    Experience the art of dining through flavors that tell a story — watch how every dish is crafted with passion, freshness, and love for food.
                </ScrollReveal>

            </div>

            <div className="w-full section-pad py-[4vw]">

                <div className="relative w-full aspect-[4/3] md:aspect-[21/9] bg-black/5 overflow-hidden border border-black/5 rounded-none group cursor-pointer">

                    <img
                        src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                        alt="Cinematic premium restaurant kitchen atmosphere"
                        className="w-full h-full object-cover object-center"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 transition-opacity duration-700 opacity-80 group-hover:opacity-100" />

                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-[16vw] h-[16vw] md:w-[6.5vw] md:h-[6.5vw] border border-white/30 bg-white/[0.08] backdrop-blur-xl rounded-full flex items-center justify-center transition-all duration-700 cubic-bezier(0.2, 1, 0.3, 1) group-hover:scale-105 group-hover:border-white/80 group-hover:bg-white/[0.15] shadow-2xl shadow-black/10">
                            <Play
                                fill="currentColor"
                                className="w-[3.5vw] h-[3.5vw] md:w-[1.2vw] md:h-[1.2vw] text-white ml-[3px] transition-transform duration-500 group-hover:scale-105"
                            />
                        </div>
                    </div>

                    <div className="absolute bottom-[3vw] right-[3vw] hidden md:flex items-center gap-[0.5vw] opacity-50 group-hover:opacity-80 transition-opacity duration-500">
                        <span className="text-[0.7vw] font-medium tracking-widest text-white uppercase">Play Behind the Scenes</span>
                        <div className="w-[1.5vw] h-[1px] bg-white" />
                    </div>

                </div>

            </div>
        </section>
    );
};

export default Testimonials;