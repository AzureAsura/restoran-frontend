export const FlowingMenuSkeleton = () => {
  return (
    <div className="w-full bg-canvas flex flex-col mt-[5vw] md:mt-[2vw] animate-pulse">
      <div className="w-full section-pad">
        <div className="w-full h-[1px] bg-black/15" />
      </div>

      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="w-full grid grid-cols-12 items-center section-pad py-[4vw] md:py-[3vw]"
        >
          <div className="col-span-2 md:col-span-1 h-[1.2vw] w-[3vw] bg-black/5" />
          <div className="col-span-8 md:col-span-10 flex justify-center">
            <div className="h-[2.5vw] md:h-[2vw] w-[30vw] bg-black/5" />
          </div>
          <div className="absolute bottom-0 left-[4vw] right-[4vw] h-[1px] bg-black/15" />
        </div>
      ))}
    </div>
  );
};

export default FlowingMenuSkeleton;
