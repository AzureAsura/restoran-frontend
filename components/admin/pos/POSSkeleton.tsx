export const POSSkeleton = () => {
  return (
    <div className="w-full h-screen max-h-screen grid grid-cols-12 bg-white border border-black/10 overflow-hidden animate-pulse">
      <div className="hidden md:flex md:col-span-3 lg:col-span-2.5 border-r border-black/10 flex-col h-full bg-black/[0.01]">
        <div className="h-16 border-b border-black/10 bg-white shrink-0" />
        <div className="flex-1 p-4 grid grid-cols-2 gap-2 content-start">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[5.5rem] bg-black/5" />
          ))}
        </div>
      </div>

      <div className="hidden md:flex md:col-span-6 border-r border-black/10 flex-col h-full bg-white">
        <div className="h-24 border-b border-black/10 bg-white shrink-0" />
        <div className="flex-1 p-4 grid grid-cols-2 lg:grid-cols-3 gap-3 bg-black/[0.01] content-start">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] bg-black/5" />
          ))}
        </div>
      </div>

      <div className="hidden md:flex md:col-span-3 lg:col-span-3.5 flex-col h-full bg-white">
        <div className="h-12 border-b border-black/10 bg-black/[0.01] shrink-0" />
        <div className="flex-1 p-4 flex items-center justify-center">
          <div className="w-full h-32 border border-dashed border-black/10" />
        </div>
      </div>
    </div>
  );
};

export default POSSkeleton;
