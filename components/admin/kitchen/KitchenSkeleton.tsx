export const KitchenSkeleton = () => {
  return (
    <div className="w-full h-screen max-h-screen bg-[#F9F9F9] flex flex-col overflow-hidden p-4 gap-4 animate-pulse">
      <div className="w-full h-16 bg-white border border-black/10 shrink-0" />

      <div className="flex-1 flex gap-4 items-start overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-[340px] shrink-0 h-full bg-white border border-black/10" />
        ))}
      </div>
    </div>
  );
};

export default KitchenSkeleton;
