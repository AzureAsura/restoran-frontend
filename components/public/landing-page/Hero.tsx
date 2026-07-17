import React from 'react';
import Link from 'next/link';

import { ArrowUpRight } from 'lucide-react';

export const Hero = () => {

    return (
        <section className="relative w-full pt-[24vw] md:pt-[14vw] flex flex-col font-sans overflow-x-hidden">

            <div className="relative w-full flex items-center justify-center select-none mt-auto mb-[2vw] md:my-auto px-0 overflow-hidden">
                <h1 className="w-full text-center font-black leading-[0.72] text-[21.2vw] tracking-[-0.08em] uppercase whitespace-nowrap -translate-x-[0.04em]"
                    style={{
                        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}
                >
                    <span>MEGATHA</span>
                </h1>
            </div>

            <hr className="section-divider my-[4vw]" />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-[4vw] items-end w-full section-pad">

                <div className="md:col-span-7 lg:col-span-6">
                    <p className="text-body text-left">
                       Enjoy fresh ingredients, authentic flavors, and dishes crafted to bring comfort, happiness, and unforgettable taste every single day.
                    </p>
                </div>

                <div className="md:col-span-5 lg:col-span-6 md:flex justify-end hidden">

                    <Link href="/menu" className="btn-split inline-flex">

                        <span className="btn-split-label px-[2.5vw]">View Menu</span>

                        <div className="btn-split-icon">
                            <ArrowUpRight strokeWidth={2.5} className="btn-split-arrow" />
                        </div>

                    </Link>

                </div>

            </div>



            <div className="w-full mt-[4vw] section-pad">

                <div className="w-full bg-canvas shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] group/img">

                    <div className="w-full overflow-hidden bg-black/5 aspect-15/10 md:aspect-16/8 relative">

                        <img
                            src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                            alt="Megatha Fine Dining Table Setup"
                            className="w-full h-full object-cover"
                            loading="eager"
                        />

                        <div className="absolute inset-0 bg-black/5 opacity-100 group-hover/img:opacity-0 transition-opacity duration-700 pointer-events-none" />

                    </div>

                </div>

            </div>

            <div className="flex w-full md:w-auto md:justify-end mt-[4vw] md:mt-0 section-pad md:hidden">

                <Link href="/menu" className="btn-split flex w-full justify-between">

                    <span className="btn-split-label px-[5vw]">View Menu</span>

                    <div className="btn-split-icon">

                        <ArrowUpRight strokeWidth={2.5} className="btn-split-arrow" />

                    </div>

                </Link>

            </div>

        </section>

    );

};