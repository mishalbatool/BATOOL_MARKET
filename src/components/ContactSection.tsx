import React, { useState } from 'react';
import { MessageCircle, PhoneCall, Mail, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';
import { WHATSAPP_NUMBER_DISPLAY, getSupportWhatsAppLink } from '../utils/whatsapp';

export const ContactSection: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let msg = `Assalam o Alaikum Batool Market,\n\n`;
    msg += `👤 Name: ${formData.name || 'Customer'}\n`;
    if (formData.phone) msg += `📱 Phone: ${formData.phone}\n`;
    if (formData.subject) msg += `📌 Subject: ${formData.subject}\n`;
    msg += `💬 Message:\n${formData.message}\n\n`;
    msg += `Please guide me.`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/923015954967?text=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="py-14 sm:py-20 bg-[#FAF9F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="max-w-2xl mx-auto text-center mb-12 space-y-3">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-widest block">
            We Are Here To Help
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
            Customer Support & Inquiries
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Have questions about product availability, fabric details, sizing, or Cash on Delivery tracking? Reach out directly via WhatsApp for fastest response.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Cards */}
          <div className="lg:col-span-5 space-y-4">
            {/* Primary WhatsApp Card */}
            <div className="bg-emerald-800 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 fill-white" />
                </div>
                <div>
                  <span className="text-emerald-200 text-xs font-semibold uppercase tracking-wider block">
                    Official WhatsApp Ordering
                  </span>
                  <h3 className="font-serif text-2xl font-bold mt-0.5">
                    Order Directly on WhatsApp
                  </h3>
                  <p className="text-xs text-emerald-100 mt-1">
                    Available 7 days a week for immediate order booking, image inquiries, and parcel tracking.
                  </p>
                </div>

                <a
                  href={`https://wa.me/923015954967?text=${encodeURIComponent('Assalam o Alaikum Batool Market, I need customer support.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white text-emerald-950 font-bold py-3 px-5 rounded-xl text-xs transition-all hover:bg-emerald-50 shadow-xs"
                >
                  <MessageCircle className="w-4 h-4 fill-emerald-800" />
                  <span>Start WhatsApp Conversation</span>
                </a>
              </div>
            </div>

            {/* Quick Details Box */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-2xs space-y-4 text-xs">
              <div className="flex items-start gap-3 text-stone-700">
                <PhoneCall className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-stone-900">Phone & Chat Support</p>
                  <p className="text-stone-500">Direct WhatsApp Calling &amp; Instant Messaging</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-stone-700">
                <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-stone-900">Operating Hours</p>
                  <p className="text-stone-500">10:00 AM – 10:00 PM (PKT), Monday to Sunday</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-stone-700">
                <MapPin className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-stone-900">Delivery Coverage</p>
                  <p className="text-stone-500">Nationwide Pakistan (All 4 provinces + AJK & Gilgit-Baltistan)</p>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Cash on Delivery Guaranteed On Every Parcel</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Message Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-2xs">
            <h3 className="font-serif text-xl font-bold text-stone-900 mb-1">
              Send a Direct Inquiry
            </h3>
            <p className="text-xs text-stone-500 mb-6">
              Fill out this quick form and click send to open your question pre-filled directly on WhatsApp with our team.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Fatima Ali"
                    className="w-full p-2.5 bg-stone-50 rounded-lg border border-stone-300 focus:outline-none focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">WhatsApp Mobile #</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. 03000000000"
                    className="w-full p-2.5 bg-stone-50 rounded-lg border border-stone-300 focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Topic / Product Inquiry</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. Unstitched Lawn availability or Delivery time to Multan"
                  className="w-full p-2.5 bg-stone-50 rounded-lg border border-stone-300 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Your Message</label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe what you are looking for or any questions about ordering..."
                  className="w-full p-2.5 bg-stone-50 rounded-lg border border-stone-300 focus:outline-none focus:border-amber-600 resize-none"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl text-xs sm:text-sm transition-all shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>Send to WhatsApp</span>
              </button>
            </form>
          </div>

        </div>

      </div>
    </section>
  );
};
