'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowRight } from 'lucide-react';

interface MenuItemData {
    link: string;
    text: string;
    image: string;
    count: string;
}

interface FlowingMenuProps {
    items: MenuItemData[];
}

export const FlowingMenu: React.FC<FlowingMenuProps> = ({ items = [] }) => {
    return (
        <div className="w-full bg-canvas flex flex-col mt-[5vw] md:mt-[2vw]">


            <div className="w-full section-pad">
                <div className="w-full h-[1px] bg-black/15" />
            </div>

            {items.map((item, idx) => (
                <MenuItem key={idx} {...item} />
            ))}
        </div>
    );
};

const MenuItem: React.FC<MenuItemData> = ({ link, text, image, count }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="w-full relative overflow-hidden select-none"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <a
                href={link}
                className="grid grid-cols-12 items-center w-full section-pad py-[4vw] md:py-[3vw] relative z-10 text-black uppercase font-medium tracking-tight transition-colors duration-300"
            >
                <span
                    className="col-span-2 md:col-span-1 text-left opacity-60 font-mono"
                    style={{ fontSize: 'clamp(0.9rem, 1.2vw, 1.5rem)' }}
                >
                    {count}
                </span>

                <span
                    className="col-span-8 md:col-span-10 text-center font-semibold tracking-wide"
                    style={{ fontSize: 'clamp(1.2rem, 2vw, 2.5rem)' }}
                >
                    {text}
                </span>

                <div className="col-span-2 md:col-span-1 flex justify-end text-black">
                    <AnimatePresence mode="wait">
                        {isHovered ? (
                            <motion.div
                                key="arrow-active"
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 5 }}
                                transition={{ duration: 0.15 }}
                            >
                                <ArrowRight strokeWidth={2} className="w-[2vw] h-[2vw] min-w-[18px] min-h-[18px]" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="arrow-normal"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                            >
                                <ArrowUpRight strokeWidth={1.5} className="w-[2vw] h-[2vw] min-w-[18px] min-h-[18px] opacity-40" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </a>

            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '-100%' }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-0 bg-[#6E3A2F] z-20 pointer-events-none flex items-center overflow-hidden"
                    >
                        {/* Jalur Marquee Ganda untuk Efek Infinite Loop Sempurna */}
                        <div className="flex whitespace-nowrap h-full items-center text-white">
                            <MarqueeRow text={text} image={image} count={count} />
                            <MarqueeRow text={text} image={image} count={count} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="absolute bottom-0 left-[4vw] right-[4vw] h-[1px] bg-black/15 z-30 pointer-events-none" />
        </div>
    );
};

const MarqueeRow: React.FC<{ text: string; image: string; count: string }> = ({ text, image, count }) => {
    return (
        <motion.div
            initial={{ x: 0 }}
            animate={{ x: '-100%' }}
            transition={{
                repeat: Infinity,
                ease: 'linear',
                duration: 48,
            }}
            className="flex items-center flex-shrink-0 pr-[4vw]"
        >
            {[...Array(4)].map((_, idx) => (
                <div key={idx} className="flex items-center flex-shrink-0">

                    <span
                        className="font-mono opacity-50 px-[2vw]"
                        style={{ fontSize: 'clamp(0.9rem, 1.2vw, 1.5rem)' }}
                    >
                        {count}
                    </span>

                    <div className="w-[14vw] h-[8.5vw] min-w-[120px] min-h-[70px] bg-black/10 overflow-hidden rounded-none mx-[2vw] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                        <img src={image} alt={text} className="w-full h-full object-cover scale-105" />
                    </div>

                    <span
                        className="font-black uppercase tracking-wide px-[2vw]"
                        style={{ fontSize: 'clamp(1.2rem, 2vw, 2.5rem)' }}
                    >
                        {text}
                    </span>
                </div>
            ))}
        </motion.div>
    );
};