import Link from "next/link";
import { ChevronLeft, ChevronRight, MapPin, Phone, Mail, MessageCircle, Navigation, Clock, Send } from "lucide-react";
import { FOOTER_CONTACT } from "@/constants/footer";
import { SITE_CONFIG } from "@/constants/site";

export const metadata = {
  title: "Contact & Location | RD Classes Sector 9, Faridabad",
  description:
    "Visit RD Classes at SCF 59-60 2nd Floor, Sector 9 Market, Faridabad or contact Ronak Sir directly via WhatsApp or phone for Class 11 & 12 Accountancy batches.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen w-full bg-[#FAF6EE] text-[#0F172A] pb-14 overflow-x-clip">
      {/* 1. HERO SECTION (Exact 24px desktop / 16px mobile top offset) */}
      <section className="w-full relative overflow-hidden bg-[#FBF7F0] border-b border-[#E8ECEF] pt-4 sm:pt-6 pb-7">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 relative z-10 space-y-3">
          {/* Breadcrumb: 13px */}
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-[13px] text-[#556987]">
              <li className="flex items-center gap-1">
                <ChevronLeft className="w-3.5 h-3.5 text-[#556987]" />
                <Link
                  href="/"
                  className="font-semibold text-[#556987] hover:text-[#0B1B3D] transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <ChevronRight className="w-3 h-3 text-[#CBD5E1]" />
              </li>
              <li className="font-semibold text-[#0B1B3D]">Contact</li>
            </ol>
          </nav>

          {/* Pill */}
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EBF5FF] px-3.5 py-1 text-xs font-bold text-[#0066FF] border border-[#BFDBFE]">
              <MapPin className="w-3.5 h-3.5 text-[#0066FF]" />
              <span>VISIT OUR INSTITUTE</span>
            </span>
          </div>

          {/* Title */}
          <h1
            className="font-extrabold text-[#0B1B3D] tracking-tight line-clamp-2 max-w-2xl"
            style={{ fontSize: "clamp(28px, 3.4vw, 44px)", lineHeight: 1.1 }}
          >
            We&apos;re Here to Help You{" "}
            <span className="relative inline-block whitespace-nowrap">
              <span className="relative z-10 text-[#0B1B3D]">Excel.</span>
              <span
                className="absolute left-0 right-0 bottom-1 sm:bottom-1.5 h-3.5 sm:h-4 bg-[#FFC93C] -z-0 rounded-xs"
                aria-hidden="true"
              />
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-[#475569] leading-relaxed max-w-[620px]">
            Visit our Sector 9 classroom, call Ronak Sir directly, or send an enquiry on WhatsApp for upcoming batch admissions and timings.
          </p>
        </div>
      </section>

      {/* 2. MAIN CONTENT GRID (40px desktop / 28px mobile section gap) */}
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-7 sm:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* Left Column: Contact Cards (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Address Card */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E8ECEF] shadow-xs space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#EBF5FF] text-[#0066FF] flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-[#0B1B3D]">Classroom Centre</h2>
                  <p className="text-xs sm:text-sm text-[#475569] leading-relaxed whitespace-pre-line">
                    {FOOTER_CONTACT.address}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <a
                  href={FOOTER_CONTACT.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0B1B3D] hover:bg-[#152B52] text-white text-xs font-bold transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5 text-[#FFB800]" />
                  <span>Open in Google Maps</span>
                </a>
              </div>
            </div>

            {/* Phone & WhatsApp Card */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E8ECEF] shadow-xs space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] text-[#16A34A] flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-[#0B1B3D]">Direct Helpline &amp; WhatsApp</h2>
                  <p className="text-xs sm:text-sm text-[#475569]">
                    Call Ronak Sir or message for instant batch schedules and seat availability.
                  </p>
                  <p className="text-base font-extrabold text-[#0B1B3D] pt-1">
                    {FOOTER_CONTACT.phoneDisplay}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <a
                  href={SITE_CONFIG.contact.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366] hover:bg-[#20BA5A] text-[#0A0A0A] text-xs font-bold transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-current" />
                  <span>Chat on WhatsApp</span>
                </a>
                <a
                  href={`tel:${FOOTER_CONTACT.phoneTel}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0B1B3D] text-xs font-bold transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>Call Directly</span>
                </a>
              </div>
            </div>

            {/* Email & Support Card */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E8ECEF] shadow-xs flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF5FF] text-[#9333EA] flex items-center justify-center shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-[#0B1B3D]">Email Address</h2>
                <p className="text-xs sm:text-sm text-[#475569]">
                  For admission verification, receipt queries, or institutional partnerships.
                </p>
                <a
                  href={`mailto:${FOOTER_CONTACT.email}`}
                  className="text-xs sm:text-sm font-bold text-[#0066FF] hover:underline block pt-1"
                >
                  {FOOTER_CONTACT.email}
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Institute Details & Timings (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E8ECEF] shadow-xs space-y-4">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-[#FFB800]" />
                <h3 className="text-base font-bold text-[#0B1B3D]">Classroom Timings</h3>
              </div>

              <div className="divide-y divide-[#F1F5F9] text-xs text-[#334155]">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-semibold text-[#0B1B3D]">Monday – Saturday</span>
                  <span className="text-[#64748B]">3:30 PM – 8:00 PM</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-semibold text-[#0B1B3D]">Sunday Mock Series</span>
                  <span className="text-[#64748B]">9:00 AM – 12:00 PM</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-semibold text-[#0B1B3D]">Doubt Clearances</span>
                  <span className="text-[#64748B]">Daily after batch</span>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#0B1B3D] to-[#152B52] text-white shadow-xs space-y-3">
              <h3 className="text-base font-bold text-white">Sunday Mock Test Registration</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Non-enrolled students can attempt our open board-simulation mock tests at the Sector 9 center by booking a slot in advance.
              </p>
              <div className="pt-2">
                <a
                  href={SITE_CONFIG.contact.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFB800] hover:bg-[#FFC933] text-[#0A0A0A] text-xs font-bold transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Reserve Mock Seat</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

