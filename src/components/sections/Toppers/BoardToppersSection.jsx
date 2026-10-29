import { getCachedFeaturedToppers } from "@/server/services/resultService";
import BoardToppersClient from "./BoardToppersClient";

export default async function BoardToppersSection() {
  const toppers = await getCachedFeaturedToppers();

  if (!toppers || toppers.length === 0) {
    return null; // Requirement: "If empty, the public section hides itself."
  }

  return <BoardToppersClient toppers={toppers} />;
}
