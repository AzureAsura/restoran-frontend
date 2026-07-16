import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export const StoryGallery = () => {
    return (
        <section className="w-full bg-canvas flex flex-col">

            <div className="w-full section-pad pt-[8vw] pb-[2vw]">
                <h2 className="text-[6vw] md:text-[3.2vw] font-bold leading-[1.1] tracking-tight uppercase text-black ">
                    Embody the coziness and warmth of premium flavor
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-[1.5vw] w-full section-pad pb-[4vw]">

                <div className="md:col-span-6 w-full aspect-[4/4] bg-black/5 overflow-hidden rounded-none">
                    <img
                        src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1200&auto=format&fit=crop"
                        alt="Signature fresh culinary dish"
                        className="w-full h-full object-cover object-center"
                    />
                </div>

                <div className="md:col-span-6 flex flex-col justify-between gap-[6vw] md:gap-[4vw] w-full">

                    <div className='hidden md:block' />

                    <div className="flex flex-col gap-[4vw] md:gap-[2vw]">

                        <div className="flex flex-col items-start gap-[4vw] md:gap-[1vw] order-2 md:order-1">
                            <p className="text-body md:text-lg max-w-[95%] md:max-w-[80%] text-black/80 font-normal leading-[1.4]">
                                Pleasant wooden finishes, natural fabrics and traditional decor elements will make you feel at home.
                                We have created an atmosphere where every guest can relax, enjoy the taste and spend time in the
                                company of close friends and family.
                            </p>

                        </div>

                        <div className="grid grid-cols-2 gap-[1.5vw] w-full order-1 md:order-2">
                            <div className="w-full aspect-[3/4] md:aspect-[0.72/1] bg-black/5 overflow-hidden rounded-none">
                                <img
                                    src="https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?q=80&w=600&auto=format&fit=crop"
                                    alt="Fresh seafood preparation"
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <div className="w-full aspect-[3/4] md:aspect-[0.72/1] bg-black/5 overflow-hidden rounded-none">
                                <img
                                    src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600&auto=format&fit=crop"
                                    alt="Premium restaurant fine dining ambience"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                    </div>

                </div>

                <div className="w-full mt-[4vw] md:hidden">
                    <div className="w-full h-[1px] bg-black/15" />
                </div>

            </div>
        </section>
    );
};