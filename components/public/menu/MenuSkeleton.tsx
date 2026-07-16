export const MenuSkeleton = () => {
  return (
    <main className="w-full bg-canvas flex flex-col section-pad pt-[20vw] md:pt-[10vw] pb-[8vw] animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-[4vw] md:gap-[2vw] items-end pb-[6vw] md:pb-[4vw] border-b border-black/5">
        <div className="md:col-span-3">
          <h1 className="text-[10vw] md:text-[4vw] font-bold tracking-tight text-black uppercase leading-[0.9]">
            Recipes
          </h1>
        </div>

        <div className="md:col-span-9 w-full flex justify-end">
          <div className="w-full md:w-[28vw] h-[6vw] md:h-[2vw] bg-black/5" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-[6vw] md:gap-[2vw] pt-[6vw] md:pt-[4vw] items-start w-full">
        <div className="md:col-span-3 flex flex-row md:flex-col gap-[4vw] md:gap-[2.5vw] overflow-x-auto md:overflow-visible pb-[4vw] md:pb-0 border-b border-black/5 md:border-b-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[5vw] md:h-[1.8vw] w-[24vw] md:w-[7vw] bg-black/5 shrink-0" />
          ))}
        </div>

        <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[4vw] md:gap-[2vw]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-full flex flex-col gap-[1.5vw]">
              <div className="w-full aspect-[4/4] bg-black/5 border border-black/5" />
              <div className="h-[4.2vw] md:h-[1.15vw] w-3/4 bg-black/5" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default MenuSkeleton;
