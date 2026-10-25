import connectDB from "@/server/db/connect";
import { Course } from "@/server/db/models/Course";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rd-classes.in";

export default async function sitemap() {
  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: new Date(),
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
        lastModified: c.updatedAt || new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    });
  } catch (err) {
    console.warn("Could not query courses for sitemap:", err?.message);
  }

  return routes;
}
