export const DashboardSkeleton = () => {
  return (
    <div className="w-full flex flex-col gap-[4vw] md:gap-[2vw] animate-pulse">

      <div className="w-full flex justify-between items-center border-b border-black/5 pb-[2vw] md:pb-[1vw]">
        <div className="h-[6vw] md:h-[1.8vw] w-[50vw] md:w-[16vw] bg-black/5" />
        <div className="h-[7vw] md:h-[2.2vw] w-[30vw] md:w-[10vw] bg-black/5" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-[2vw] md:gap-[0.8vw]">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border border-black/5 bg-white h-[24vw] md:h-[7.5vw]" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-[3vw] md:gap-[1vw]">
        <div className="lg:col-span-8 border border-black/5 bg-white h-[70vw] md:h-[24vw]" />
        <div className="lg:col-span-4 border border-black/5 bg-white h-[70vw] md:h-[24vw]" />
      </div>

      <div className="w-full border border-black/5 bg-white h-[60vw] md:h-[18vw]" />

    </div>
  );
};

export default DashboardSkeleton;
