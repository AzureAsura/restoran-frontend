import { Clock, MapPin, Phone } from 'lucide-react';

const InfoCards = () => {
  return (
    <section className="w-full bg-canvas border-t border-b border-black/5 flex flex-col section-pad py-[10vw] md:py-[6vw]">
      
      <div className="w-full text-center pb-[6vw] md:pb-[4vw]">
        <span className="text-[3vw] md:text-[0.85vw] font-medium tracking-[0.2em] text-black/40 uppercase">
          Essential Information
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-[4vw] md:gap-[2vw] w-full items-stretch">
        
        <div className="bg-white border border-black/5 p-[6vw] md:p-[2.5vw] flex flex-col items-center text-center justify-between rounded-none shadow-xl shadow-black/[0.01] transition-transform duration-300 hover:border-black/20 w-full">

          <div className="flex flex-col items-center gap-[2vw] md:gap-[0.8vw] w-full">
            <Clock className="w-[5vw] h-[5vw] md:w-[1.2vw] md:h-[1.2vw] text-[#6E3A2F] stroke-[2]" />
            <h3 className="text-[3.5vw] md:text-[0.85vw] font-bold tracking-[0.1em] text-black uppercase">
              Opening Hours
            </h3>
          </div>
          
          <div className="flex flex-col gap-[3vw] md:gap-[0.8vw] border-t border-black/5 pt-[4vw] md:pt-[1.5vw] mt-[4vw] md:mt-[2vw] w-full">
            <div className="flex flex-col gap-[0.5vw]">
              <span className="text-[2.8vw] md:text-[0.7vw] font-bold text-black/40 uppercase tracking-widest">Mon — Thu</span>
              <span className="text-[3.8vw] md:text-[1vw] font-semibold text-black">17:00 — 23:00</span>
            </div>
            <div className="flex flex-col gap-[0.5vw] mt-[2vw] md:mt-0">
              <span className="text-[2.8vw] md:text-[0.7vw] font-bold text-black/40 uppercase tracking-widest">Fri — Sun</span>
              <span className="text-[3.8vw] md:text-[1vw] font-semibold text-black">16:00 — 00:00</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-black/5 p-[6vw] md:p-[2.5vw] flex flex-col items-center text-center justify-between rounded-none shadow-xl shadow-black/[0.01] transition-transform duration-300 hover:border-black/20 w-full">
          <div className="flex flex-col items-center gap-[2vw] md:gap-[0.8vw] w-full">
            <MapPin className="w-[5vw] h-[5vw] md:w-[1.2vw] md:h-[1.2vw] text-[#6E3A2F] stroke-[2]" />
            <h3 className="text-[3.5vw] md:text-[0.85vw] font-bold tracking-[0.1em] text-black uppercase">
              Our Location
            </h3>
          </div>

          <div className="flex flex-col gap-[1.5vw] md:gap-[0.5vw] border-t border-black/5 pt-[4vw] md:pt-[1.5vw] mt-[4vw] md:mt-[2vw] w-full flex-1 justify-center">
            <p className="text-[4vw] md:text-[1.05vw] font-bold text-black uppercase leading-[1.3] tracking-tight">
              Megatha Restaurant & Lounge
            </p>
            <p className="text-[3.8vw] md:text-[0.95vw] font-medium text-black/50 uppercase leading-[1.4] tracking-tight max-w-[85vw] md:max-w-none mx-auto">
              248 Øvregaten, Bergen, Hordaland, Norway
            </p>
          </div>
        </div>

        <div className="bg-white border border-black/5 p-[6vw] md:p-[2.5vw] flex flex-col items-center text-center justify-between rounded-none shadow-xl shadow-black/[0.01] transition-transform duration-300 hover:border-black/20 w-full">
          <div className="flex flex-col items-center gap-[2vw] md:gap-[0.8vw] w-full">
            <Phone className="w-[5vw] h-[5vw] md:w-[1.2vw] md:h-[1.2vw] text-[#6E3A2F] stroke-[2]" />
            <h3 className="text-[3.5vw] md:text-[0.85vw] font-bold tracking-[0.1em] text-black uppercase">
              Direct Contact
            </h3>
          </div>

          <div className="flex flex-col gap-[3vw] md:gap-[0.8vw] border-t border-black/5 pt-[4vw] md:pt-[1.5vw] mt-[4vw] md:mt-[2vw] w-full">
            <div className="flex flex-col">
              <span className="text-[2.8vw] md:text-[0.7vw] font-bold text-black/40 uppercase tracking-widest">Phone Call</span>
              <a href="tel:+4755321000" className="text-[4vw] md:text-[1.1vw] font-bold text-black uppercase tracking-tight hover:text-[#6E3A2F] transition-colors duration-300">
                +47 5532 1000
              </a>
            </div>
            <div className="flex flex-col mt-[2vw] md:mt-0">
              <span className="text-[2.8vw] md:text-[0.7vw] font-bold text-black/40 uppercase tracking-widest">General Inquiry</span>
              <a href="mailto:info@megatha.com" className="text-[3.8vw] md:text-[1vw] font-medium text-black/60 hover:text-black transition-colors duration-300">
                info@megatha.com
              </a>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default InfoCards;