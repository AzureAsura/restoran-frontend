export const MenuSkeleton = () => {
  return (
    <div className="w-full flex flex-col gap-[5vw] md:gap-[2.5vw] animate-pulse">

      <div className="w-full flex justify-between items-center border-b border-black/5 pb-[2vw] md:pb-[1vw]">
        <div className="h-[6vw] md:h-[1.8vw] w-[50vw] md:w-[16vw] bg-black/5" />
        <div className="h-[7vw] md:h-[2.2vw] w-[30vw] md:w-[10vw] bg-black/5" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-[2vw] md:gap-[0.6vw]">
        <div className="md:col-span-8 h-[10vw] md:h-[2.5vw] bg-black/5" />
        <div className="md:col-span-4 h-[10vw] md:h-[2.5vw] bg-black/5" />
      </div>

      <div className="w-full bg-white border border-black/5 h-[80vw] md:h-[24vw]" />

      <div className="w-full border border-black/5 bg-white h-[40vw] md:h-[12vw]" />

    </div>
  );
};

export default MenuSkeleton;
