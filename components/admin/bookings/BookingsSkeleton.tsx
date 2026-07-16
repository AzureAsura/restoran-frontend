export const BookingsSkeleton = () => {
  return (
    <div className="w-full flex flex-col gap-3 md:gap-[2vw] overflow-hidden animate-pulse">

      <div className="w-full bg-white border border-black/5 p-4 md:p-[1.5vw] flex flex-col gap-3 md:gap-[1.2vw]">
        <div className="flex justify-between items-center gap-3">
          <div className="h-9 w-40 bg-black/5" />
          <div className="h-9 w-28 bg-black/5" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-[2vw] w-full">
          <div className="h-8 flex-1 bg-black/5" />
          <div className="grid grid-cols-2 gap-2 md:flex md:items-center md:gap-[1.5vw] shrink-0 md:min-w-[25vw]">
            <div className="h-8 w-full md:w-[12vw] bg-black/5" />
            <div className="h-8 w-full md:w-[10vw] bg-black/5" />
          </div>
        </div>
      </div>

      <div className="hidden md:block w-full bg-white border border-black/5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-b border-black/5 last:border-b-0 h-[3.5vw]" />
        ))}
      </div>

      <div className="flex flex-col gap-2 md:hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-black/5 h-28" />
        ))}
      </div>
    </div>
  );
};

export default BookingsSkeleton;
