import connectDB from "@/server/db/connect";
import { Course } from "@/server/db/models/Course";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rd-classes.in";

const BUILD_DATE = new Date("2026-10-25T00:00:00.000Z");

export default async function sitemap() {
  const routes = [
    {
      url: baseUrl,
      lastModified: BUILD_DATE,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: BUILD_DATE,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  try {
    await connectDB();
    const courses = await Course.find({ published: true }).select("slug updatedAt").lean();
    courses.forEach((c) => {
      routes.push({
        url: `${baseUrl}/courses/${c.slug}`,
        lastModified: c.updatedAt || BUILD_DATE,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    });
  } catch (err) {
    console.warn("Could not query courses for sitemap:", err?.message);
  }

  return routes;
}
