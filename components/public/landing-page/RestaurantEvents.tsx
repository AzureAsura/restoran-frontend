'use client';

import React from 'react';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from '@/components/ui/carousel';

export const RestaurantEvents = () => {
    const sliderEvents = [
        {
            id: 1,
            image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop',
            title: '"Norwegian Fjord" Party',
            date: 'May 8th, at 8:00 PM',
        },
        {
            id: 2,
            image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=800&auto=format&fit=crop',
            title: 'Master class on cooking "Salmon in Scandinavian style"',
            date: 'June 16th, at 6:00 PM',
        },
        {
            id: 3,
            image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop',
            title: 'Nordic Smoked Meat Exclusive Tasting',
            date: 'July 22nd, at 7:30 PM',
        },
    ];

    return (
        <section className="w-full bg-canvas flex flex-col section-pad py-[4vw]">

            <div className="w-full flex flex-col items-start gap-[2vw] md:flex-row md:justify-between md:items-end md:gap-0 pb-[6vw] md:pb-[4vw]">

                <span className="text-[3vw] md:text-[0.85vw] font-medium tracking-[0.1em] text-black/40 uppercase">
                    Waiting for you
                </span>

                <h2 className="text-[6.5vw] md:text-[2.2vw] font-bold tracking-tight uppercase text-black leading-[1.1] max-w-[85%] md:max-w-none">
                    Events in our restaurant
                </h2>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-[4vw] md:gap-[2vw] w-full items-start">

                <div className="md:col-span-5 flex flex-col gap-[1.5vw] w-full">
                    <div className="w-full aspect-[4/4] md:aspect-[0.85/1] bg-black/5 overflow-hidden rounded-none">
                        <img
                            src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop"
                            alt="Tasting Dinner Magic of the Fjords"
                            className="w-full h-full object-cover object-center"
                        />
                    </div>
                    <div className="flex flex-col gap-[0.5vw]">
                        <h3 className="text-[4.5vw] md:text-[1.35vw] font-bold uppercase text-black tracking-tight leading-[1.2]">
                            Tasting Dinner "Magic of the Fjords"
                        </h3>
                        <p className="text-[3.5vw] md:text-[0.9vw] font-medium text-black/40 uppercase tracking-wider">
                            April 20th, at 7:00 PM
                        </p>
                    </div>
                </div>

                <div className="md:col-span-7 w-full overflow-hidden">

                    <Carousel
                        opts={{
                            align: 'start',
                            dragFree: true,
                        }}
                        className="w-full cursor-grab active:cursor-grabbing"
                    >
                        <CarouselContent className="-ml-[2vw] items-start">
                            {sliderEvents.map((event) => (
                                <CarouselItem
                                    key={event.id}
                                    className="pl-[2vw] basis-[75vw] md:basis-[24vw] flex flex-col gap-[1.5vw] select-none"
                                >

                                    <div className="relative w-full aspect-[4/4] md:aspect-auto md:h-auto bg-black/5 overflow-hidden rounded-none group">
                                        <img
                                            src={event.image}
                                            alt={event.title}
                                            className="w-full h-full object-cover md:h-auto pointer-events-none"
                                        />

                                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                            <div className="w-[16vw] h-[16vw] md:w-[5.5vw] md:h-[5.5vw] bg-[#6E3A2F] rounded-full flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-500">
                                                <span className="text-white text-[3vw] md:text-[0.8vw] font-medium uppercase tracking-widest">
                                                    Drag
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-[0.5vw]">
                                        <h3 className="text-[4.2vw] md:text-[1.2vw] font-bold uppercase text-black tracking-tight leading-[1.25] max-w-[90%]">
                                            {event.title}
                                        </h3>
                                        <p className="text-[3.2vw] md:text-[0.85vw] font-medium text-black/40 uppercase tracking-wider">
                                            {event.date}
                                        </p>
                                    </div>

                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>

                </div>

            </div>
        </section>
    );
};

export default RestaurantEvents;