import Reveal from "@/components/ui/Reveal";
import InViewSection from "@/components/ui/InViewSection";
import StatItem from "./StatItem";
import { getCachedWebsiteStats } from "@/server/services/courseService";

function parseStat(raw, defaultVal, defaultSuffix) {
  if (!raw && defaultVal !== undefined) {
    return { value: defaultVal, suffix: defaultSuffix || "" };
  }
  if (!raw) return null;
  const match = raw.toString().match(/([\d,.]+)\s*(.*)/);
  if (!match) return { value: raw, suffix: "" };
  const num = parseFloat(match[1].replace(/,/g, ""));
  return {
    value: isNaN(num) ? match[1] : num,
    suffix: match[2] || "",
  };
}

/**
 * Section C: Stats Band
 * id="results"
 * Dynamically feeds from Settings.websiteNumbers and published Lecture counts.
 * Hides completely when all four values are empty and no published lectures exist.
 */
export default async function StatsSection() {
  const { websiteNumbers, publishedLecturesCount } = await getCachedWebsiteStats();

  const rawMentored = websiteNumbers.studentsMentored?.trim();
  const rawSuccess = websiteNumbers.boardSuccessRate?.trim();
  const rawTests = websiteNumbers.testsEvaluated?.trim();
  const rawLectures = websiteNumbers.recordedLectures?.trim();

  const defaultLectures = publishedLecturesCount > 0 ? publishedLecturesCount : 136;
  const totalLecturesEffective = rawLectures || `${defaultLectures}+`;

  const mentoredParsed = parseStat(rawMentored, 500, "+");
  const successParsed = parseStat(rawSuccess, 95, "%+");
  const testsParsed = parseStat(rawTests, 1200, "+");
  const lecturesParsed = parseStat(totalLecturesEffective, defaultLectures, "+");

  const stats = [
    mentoredParsed && {
      id: "students-mentored",
      icon: "Users",
      value: mentoredParsed.value,
      suffix: mentoredParsed.suffix,
      label: "Students Mentored",
      description: "Years of dedicated Class 11 & 12 batches in Sector 9",
    },
    successParsed && {
      id: "success-rate",
      icon: "Award",
      value: successParsed.value,
      suffix: successParsed.suffix,
      label: "Board Success Rate",
      description: "Consistent 90+ marks & first division board records",
    },
    testsParsed && {
      id: "tests-evaluated",
      icon: "ClipboardCheck",
      value: testsParsed.value,
      suffix: testsParsed.suffix,
      label: "Tests Evaluated",
      description: "Weekly Sunday tests checked personally by Ronak Sir",
    },
    lecturesParsed && {
      id: "recorded-lectures",
      icon: "Video",
      value: lecturesParsed.value,
      suffix: lecturesParsed.suffix,
      label: "Recorded Lectures",
      description: "Complete HD video library with chapter-wise notes",
    },
  ].filter(Boolean);

  if (stats.length === 0) {
    return null;
  }

  return (
    <InViewSection
      id="achievements"
      aria-label="Achievements and statistics"
      className="relative w-full overflow-hidden text-white scroll-mt-20 [isolation:isolate] lg:box-border"
      style={{
        paddingTop: "clamp(48px, 5vw, calc(var(--su, 1px) * 68))",
        paddingBottom: "clamp(44px, 4.2vw, calc(var(--su, 1px) * 53))",
        background:
          "linear-gradient(90deg, #171310 0%, #1F160C 14%, #381E09 26%, #5C2E06 40%, #7E3505 55%, #9B3804 70%, #8E2B02 84%, #7D1804 100%)",
      }}
    >
      {/* Corner Circles */}
      <div
        className="absolute rounded-full pointer-events-none lg:animate-stat-circle-drift"
        style={{
          width: "calc(var(--su, 1px) * 460)",
          height: "calc(var(--su, 1px) * 460)",
          left: "calc(var(--su, 1px) * -330)",
          top: "calc(var(--su, 1px) * -380)",
          background: "rgba(0, 0, 0, 0.05)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute rounded-full pointer-events-none lg:animate-stat-circle-drift"
        style={{
          width: "calc(var(--su, 1px) * 580)",
          height: "calc(var(--su, 1px) * 580)",
          left: "calc(var(--su, 1px) * -275)",
          bottom: "calc(var(--su, 1px) * -390)",
          background: "rgba(60, 36, 12, 0.70)",
          animationDelay: "-6s",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute rounded-full pointer-events-none lg:animate-stat-circle-drift"
        style={{
          width: "calc(var(--su, 1px) * 490)",
          height: "calc(var(--su, 1px) * 490)",
          left: "calc(var(--su, 1px) * -300)",
          bottom: "calc(var(--su, 1px) * -385)",
          background:
            "radial-gradient(circle at 45% 45%, #AB7014 0%, #9B6210 40%, #764508 70%, #462805 88%, transparent 100%)",
          animationDelay: "-12s",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute rounded-full pointer-events-none lg:animate-stat-circle-drift"
        style={{
          width: "calc(var(--su, 1px) * 520)",
          height: "calc(var(--su, 1px) * 520)",
          right: "calc(var(--su, 1px) * -260)",
          top: "calc(var(--su, 1px) * -340)",
          background:
            "radial-gradient(circle at 50% 50%, #F84C00 0%, #EA3E00 28%, #C23000 56%, #942200 82%, transparent 98%)",
          animationDelay: "-18s",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute rounded-full pointer-events-none lg:animate-stat-circle-drift"
        style={{
          width: "calc(var(--su, 1px) * 480)",
          height: "calc(var(--su, 1px) * 480)",
          right: "calc(var(--su, 1px) * -240)",
          bottom: "calc(var(--su, 1px) * -328)",
          background:
            "radial-gradient(circle at 50% 50%, #E64C00 0%, #D84200 48%, #BE3600 75%, #881E00 96%, transparent 100%)",
          animationDelay: "-8s",
        }}
        aria-hidden="true"
      />

      {/* Content Container */}
      <div
        className="relative z-10 w-full max-w-[1600px] lg:max-w-[calc(var(--su,1px)*1600)] mx-auto px-3 lg:px-0"
        style={{
          paddingLeft: "clamp(12px, 3.5vw, calc(var(--su, 1px) * 75))",
          paddingRight: "clamp(12px, 3.5vw, calc(var(--su, 1px) * 75))",
        }}
      >
        <Reveal className="w-full">
          {/* Desktop Layout (>=1024px) */}
          <div
            className="hidden lg:grid items-center w-full relative"
            style={{
              gridTemplateColumns: "366fr 365fr 367fr 352fr",
            }}
          >
            {stats.map((stat, idx) => (
              <div
                key={stat.id}
                className="flex items-center justify-center relative min-w-0"
              >
                <StatItem stat={stat} index={idx} />
                {idx < stats.length - 1 && (
                  <div
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-[1px] animate-divider-draw"
                    style={{
                      height: "calc(var(--su, 1px) * 210)",
                      background:
                        "linear-gradient(to bottom, transparent, rgba(255, 170, 60, 0.3), transparent)",
                    }}
                    aria-hidden="true"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Mobile & Tablet Layout (<1024px) */}
          <div className="grid grid-cols-2 lg:hidden w-full relative py-1 [grid-auto-rows:1fr]">
            <div
              className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-[1px] bg-[rgba(255,170,60,0.22)]"
              aria-hidden="true"
            />
            <div
              className="absolute top-4 bottom-4 left-1/2 -translate-x-1/2 w-[1px] bg-[rgba(255,170,60,0.22)]"
              aria-hidden="true"
            />

            {stats.map((stat, idx) => (
              <div
                key={stat.id}
                className="flex flex-col items-center justify-start py-6 px-2 min-w-0 h-full"
              >
                <StatItem stat={stat} index={idx} />
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </InViewSection>
  );
}
