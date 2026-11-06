import { getCachedFeaturedToppers } from "@/server/services/resultService";
import BoardToppersClient from "./BoardToppersClient";

// Clean placeholder toppers shown ONLY if the database has zero records
const placeholderToppers = [
  {
    _id: "placeholder-1",
    isPlaceholder: true,
    name: "Topper photo coming soon",
    school: "CBSE Board Merit",
    marks: "100",
    score: "100",
    outOf: 100,
    year: "2025",
    classLevel: "12",
  },
  {
    _id: "placeholder-2",
    isPlaceholder: true,
    name: "Topper photo coming soon",
    school: "CBSE Board Merit",
    marks: "99",
    score: "99",
    outOf: 100,
    year: "2025",
    classLevel: "12",
  },
  {
    _id: "placeholder-3",
    isPlaceholder: true,
    name: "Topper photo coming soon",
    school: "CBSE Board Merit",
    marks: "98",
    score: "98",
    outOf: 100,
    year: "2025",
    classLevel: "11",
  },
];

export default async function BoardToppersSection() {
  const toppers = await getCachedFeaturedToppers();
  const displayToppers = toppers && toppers.length > 0 ? toppers : placeholderToppers;

  return <BoardToppersClient toppers={displayToppers} />;
}
