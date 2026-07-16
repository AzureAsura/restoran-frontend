export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-canvas border-t border-black/15 flex flex-col section-pad py-[4vw] gap-[8vw] md:gap-[4vw]">
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-[6vw] md:gap-[2vw] items-start w-full">
        
        <div className="md:col-span-6 flex flex-col">
          <h1 className="text-[10vw] md:text-[4.5vw] font-bold tracking-tighter uppercase text-black leading-[0.9]">
            Megatha
          </h1>
          <p className="text-[3.5vw] md:text-[0.9vw] text-black/50 uppercase tracking-widest mt-[2vw] md:mt-[1vw]">
            Fine Dining Experience
          </p>
        </div>

        <div className="md:col-span-3 flex flex-col gap-[3vw] md:gap-[1.2vw]">
          <span className="text-[3vw] md:text-[0.8vw] font-medium tracking-[0.2em] text-black/40 uppercase">
            Navigation
          </span>
          <ul className="flex flex-col gap-[2vw] md:gap-[0.6vw]">
            {['About', 'Menu', 'Events', 'Reservations', 'Contact'].map((item) => (
              <li key={item}>
                <a 
                  href={`#${item.toLowerCase()}`} 
                  className="text-[4vw] md:text-[1.05vw] font-semibold uppercase text-black tracking-tight hover:text-black/50 transition-colors duration-300"
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-3 flex flex-col gap-[3vw] md:gap-[1.2vw]">
          <span className="text-[3vw] md:text-[0.8vw] font-medium tracking-[0.2em] text-black/40 uppercase">
            Address
          </span>
          <p className="text-[4vw] md:text-[1.05vw] font-semibold uppercase text-black tracking-tight leading-[1.3] max-w-[90%]">
            248 Øvregaten, Bergen,<br />Hordaland, Norway
          </p>
          <a 
            href="mailto:reservations@thefjords.com" 
            className="text-[3.8vw] md:text-[1vw] font-medium text-black/60 hover:text-black transition-colors duration-300 mt-[1vw]"
          >
            reservations@megatha.com
          </a>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-[6vw] md:gap-[2vw] border-t border-black/15 pt-[6vw] md:pt-[3vw] w-full items-end">
        
        <div className="md:col-span-6 grid grid-cols-2 gap-[4vw] md:gap-[2vw]">
          <div className="flex flex-col gap-[1vw] md:gap-[0.4vw]">
            <span className="text-[2.8vw] md:text-[0.75vw] font-medium tracking-wider text-black/40 uppercase">
              Mon — Thu
            </span>
            <p className="text-[3.8vw] md:text-[1vw] font-semibold text-black uppercase">
              17:00 — 23:00
            </p>
          </div>
          <div className="flex flex-col gap-[1vw] md:gap-[0.4vw]">
            <span className="text-[2.8vw] md:text-[0.75vw] font-medium tracking-wider text-black/40 uppercase">
              Fri — Sun
            </span>
            <p className="text-[3.8vw] md:text-[1vw] font-semibold text-black uppercase">
              16:00 — 00:00
            </p>
          </div>
        </div>

        <div className="md:col-span-6 flex justify-start md:justify-end gap-[4vw] md:gap-[2vw]">
          {['Instagram', 'Facebook', 'Vimeo'].map((platform) => (
            <a 
              key={platform} 
              href={`https://${platform.toLowerCase()}.com`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[3.5vw] md:text-[0.9vw] font-medium uppercase tracking-widest text-black/60 hover:text-black transition-colors duration-300"
            >
              [{platform}]
            </a>
          ))}
        </div>

      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-t border-black/15 pt-[4vw] md:pt-[2vw] gap-[3vw] md:gap-0 w-full">
        <span className="text-[3vw] md:text-[0.75vw] text-black/40 uppercase tracking-wider">
          © {currentYear} The Fjords. All rights reserved.
        </span>
        <span className="text-[3vw] md:text-[0.75vw] text-black/40 uppercase tracking-wider flex items-center gap-[1vw]">
          Designed by <span className="text-black font-medium">Palm Game Studio</span>
        </span>
      </div>

    </footer>
  );
};

export default Footer;