import Link from "next/link";
import Image from "next/image";
import { Trophy, FileText, Download, Award, Star, ArrowRight } from "lucide-react";
import { getCachedResultsData } from "@/server/services/resultService";

export const metadata = {
  title: "Board Results & Merit Scorers | RD Classes",
  description:
    "Celebrating 100/100 and 95+ score holders in CBSE Class 11 and 12 Accountancy board examinations from RD Classes Faridabad.",
  alternates: {
    canonical: "/results",
  },
};

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "PDF Document";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default async function ResultsPage() {
  const { toppers, resultPdfs } = await getCachedResultsData();

  const hasToppers = toppers && toppers.length > 0;
  const hasPdfs = resultPdfs && resultPdfs.length > 0;

  return (
    <main className="min-h-screen bg-[#FBF8F1] text-[#0B1B3B] pt-4 sm:pt-6 pb-12 sm:pb-16">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF9EB] border border-[#FDE68A] text-[#92400E] text-xs font-bold uppercase tracking-wider mb-4 shadow-2xs">
            <Trophy className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>EXCELLENCE IN ACCOUNTANCY</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0B1B3B] tracking-tight leading-tight">
            Celebrating Our Board Toppers &amp; Official Results
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#5F6A7A] leading-relaxed">
            Consistent 100/100 and 95+ distinctions in CBSE Class 11 &amp; 12. Proof of concept-first teaching and dedicated practice.
          </p>
        </div>

        {/* 1. Board Toppers Grid */}
        <section aria-label="Merit Scorers" className="mb-10 sm:mb-12">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-[#0B1B3B] tracking-tight flex items-center gap-2.5">
                <Award className="w-6 h-6 text-[#FFB800]" />
                <span>Merit Scorers &amp; Century Scorers</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#5F6A7A] mt-1">
                Students felicitated for exceptional scores in Board examinations.
              </p>
            </div>
            {hasToppers && (
              <span className="text-xs font-bold text-[#1593C9] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                {toppers.length} Topper{toppers.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {!hasToppers ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center max-w-lg mx-auto">
              <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-800">Results Updating Soon</h3>
              <p className="text-xs text-gray-500 mt-1">
                Official merit scorers and distinction lists for current academic sessions will be updated shortly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {toppers.map((topper) => (
                <div
                  key={topper._id.toString()}
                  className="group relative flex flex-col items-center text-center rounded-3xl border border-black/8 bg-white p-6 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Photo with golden ring */}
                  <div className="relative h-28 w-28 mb-4">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FFB800] to-[#FFE59E] p-1 shadow-md">
                      <div className="relative h-full w-full rounded-full overflow-hidden bg-gray-100">
                        {topper.photoUrl || topper.photo ? (
                          <Image
                            src={topper.photoUrl || topper.photo}
                            alt={topper.name}
                            fill
                            className="object-cover"
                            sizes="112px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-black text-xl text-gray-400">
                            {topper.name?.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Star Badge */}
                    <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#0B1B3B] text-[#FFB800] border-2 border-white shadow-xs">
                      <Star className="h-4 w-4 fill-[#FFB800]" />
                    </div>
                  </div>

                  {/* Marks Pill */}
                  <div className="mb-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-[#FFF8E6] text-[#B47500] border border-[#FFE59E] shadow-2xs">
                      {topper.marks || topper.score}
                    </span>
                  </div>

                  {/* Student Details */}
                  <h3 className="text-base font-extrabold text-[#0B1B3B] group-hover:text-[#1593C9] transition-colors line-clamp-1">
                    {topper.name}
                  </h3>
                  <p className="mt-1 text-xs text-[#5F6A7A] line-clamp-2">
                    {topper.school}
                  </p>

                  <div className="mt-4 pt-3 border-t border-gray-100 w-full flex items-center justify-between text-[11px] font-bold text-gray-400">
                    <span>CBSE Board</span>
                    <span className="text-[#0B1B3B]">{topper.year || topper.examYear}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 2. Official Result PDFs Section */}
        <section aria-label="Official Result PDFs">
          <div className="flex items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-extrabold text-[#0B1B3B] tracking-tight flex items-center gap-2.5">
                <FileText className="w-6 h-6 text-red-600" />
                <span>Official Result Gazette &amp; PDF Lists</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#5F6A7A] mt-1">
                Download verified marksheets and school-wise performance records in PDF format.
              </p>
            </div>
          </div>

          {!hasPdfs ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center max-w-lg mx-auto">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-gray-800">No PDF sheets uploaded yet</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Official board marksheets will be published here upon declaration.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {resultPdfs.map((pdf) => (
                <div
                  key={pdf._id.toString()}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-black/8 bg-white p-5 shadow-2xs hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-100">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-extrabold text-[#0B1B3B] truncate" title={pdf.title}>
                        {pdf.title}
                      </h4>
                      <p className="text-xs text-[#5F6A7A] mt-0.5">
                        {pdf.classLabel || "Class 12"} • {pdf.year || pdf.examYear} • {formatBytes(pdf.sizeBytes || pdf.fileSize)}
                      </p>
                    </div>
                  </div>

                  <a
                    href={pdf.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B1B3B] hover:bg-[#1593C9] text-white px-3.5 py-2 text-xs font-bold transition-colors shrink-0 shadow-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Download</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
