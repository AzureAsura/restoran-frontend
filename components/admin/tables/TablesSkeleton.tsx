export const TablesSkeleton = () => {
  return (
    <div className="w-full flex flex-col gap-[4vw] md:gap-[2vw] animate-pulse">

      <div className="w-full bg-white border border-black/5 p-[4vw] md:p-[1.5vw] flex flex-col md:flex-row justify-between items-stretch md:items-center gap-[3vw] md:gap-[1.5vw]">
        <div className="h-[4vw] md:h-[1vw] w-[40vw] md:w-[12vw] bg-black/5" />
        <div className="flex flex-col sm:flex-row gap-[2vw] md:gap-[1vw]">
          <div className="h-[8vw] sm:h-[2.5vw] w-full sm:w-[160px] bg-black/5" />
          <div className="h-[8vw] sm:h-[2.5vw] w-full sm:w-[160px] bg-black/5" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[4vw] md:gap-[1.5vw] w-full">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border border-black/5 bg-white h-[45vw] md:h-[12vw]" />
        ))}
      </div>
    </div>
  );
};

export default TablesSkeleton;
