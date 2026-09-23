import React from 'react';
import { Truck, Banknote, MessageCircle, Sparkles, ShieldCheck } from 'lucide-react';

export const Benefits: React.FC = () => {
  const benefits = [
    {
      icon: Truck,
      title: "Free Delivery All Over Pakistan",
      subtitle: "No hidden delivery charges nationwide",
      color: "text-amber-700 bg-amber-50 border-amber-200/80"
    },
    {
      icon: Banknote,
      title: "Cash on Delivery",
      subtitle: "Inspect & pay at your doorstep",
      color: "text-emerald-700 bg-emerald-50 border-emerald-200/80"
    },
    {
      icon: MessageCircle,
      title: "Easy WhatsApp Ordering",
      subtitle: "Direct 1-click confirmation on WhatsApp",
      color: "text-green-700 bg-green-50 border-green-200/80"
    },
    {
      icon: Sparkles,
      title: "Quality Products",
      subtitle: "Carefully checked & verified items",
      color: "text-amber-700 bg-amber-50 border-amber-200/80"
    },
    {
      icon: ShieldCheck,
      title: "Safe & Simple Shopping",
      subtitle: "No complicated signups or passwords",
      color: "text-stone-800 bg-stone-100 border-stone-200"
    },
  ];

  return (
    <section className="bg-white border-y border-stone-200/70 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
          {benefits.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="flex flex-col items-center text-center p-3.5 rounded-xl border border-stone-100 hover:border-amber-200 bg-[#FCFBF8] transition-all hover:shadow-xs group"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2.5 border ${item.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-stone-900 leading-snug">
                  {item.title}
                </h4>
                <p className="text-[11px] text-stone-500 mt-1 leading-normal">
                  {item.subtitle}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
