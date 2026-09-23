import React from 'react';
import { Truck, Banknote, PhoneCall, Sparkles } from 'lucide-react';
import { WHATSAPP_NUMBER_DISPLAY } from '../utils/whatsapp';

export const AnnouncementBar: React.FC = () => {
  return (
    <div className="bg-[#181816] text-[#FAF9F5] border-b border-[#2C2A24] text-xs font-medium tracking-wide">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-4 mx-auto sm:mx-0 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-amber-300 font-semibold uppercase tracking-wider">
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              Free Delivery All Over Pakistan
            </span>
            <span className="hidden md:inline-block text-stone-600">|</span>
            <span className="hidden md:inline-flex items-center gap-1.5 text-stone-300">
              <Banknote className="w-3.5 h-3.5 text-emerald-400" />
              Cash on Delivery (Pay at Doorstep)
            </span>
            <span className="hidden lg:inline-block text-stone-600">|</span>
            <span className="hidden lg:inline-flex items-center gap-1.5 text-stone-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              100% Quality Checked
            </span>
          </div>

          <div className="flex items-center justify-center gap-3 mx-auto sm:mx-0">
            <a
              href={`https://wa.me/923015954967?text=${encodeURIComponent('Assalam o Alaikum Batool Market, I would like to place an order or inquire about your products.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-amber-300 hover:text-amber-200 transition-colors font-medium text-xs group"
            >
              <PhoneCall className="w-3 h-3 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="font-semibold underline decoration-amber-400/50">WhatsApp Us</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
