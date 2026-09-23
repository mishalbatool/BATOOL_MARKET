import React from 'react';
import { ShieldCheck, Truck, Banknote, HeartHandshake, Award, Clock } from 'lucide-react';

export const WhyChooseUs: React.FC = () => {
  const points = [
    {
      icon: Award,
      title: "Handpicked Premium Quality",
      desc: "Every item is rigorously inspected for fabric durability, stitch precision, and finish before packing."
    },
    {
      icon: Banknote,
      title: "Cash on Delivery",
      desc: "Zero payment risk. Pay when the courier hands the parcel to you in your hands."
    },
    {
      icon: Truck,
      title: "100% Free Shipping",
      desc: "No hidden parcel fees or unexpected courier costs anywhere across Pakistan."
    },
    {
      icon: HeartHandshake,
      title: "Friendly WhatsApp Concierge",
      desc: "Have a question about sizes or unstitched fabric? Text us anytime on WhatsApp for real human help."
    },
    {
      icon: Clock,
      title: "Fast Dispatch & Tracking",
      desc: "Orders are processed within 24 hours with live tracking updates shared to your WhatsApp."
    }
  ];

  return (
    <section className="py-14 bg-white border-y border-stone-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-widest block mb-1.5">
            The Batool Market Promise
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900">
            Why Shop With Batool Market?
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-2">
            We bring Pakistan's most sought-after fashion, jewellery, and home products directly to you with unmatched reliability and care.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {points.map((pt, index) => {
            const Icon = pt.icon;
            return (
              <div
                key={index}
                className="p-5 rounded-2xl border border-stone-200/80 bg-[#FCFBF8] hover:border-amber-300 transition-all hover:shadow-xs group flex items-start gap-4"
              >
                <div className="w-11 h-11 rounded-xl bg-amber-100/70 border border-amber-200/70 text-amber-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900 group-hover:text-amber-800 transition-colors">
                    {pt.title}
                  </h4>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    {pt.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
