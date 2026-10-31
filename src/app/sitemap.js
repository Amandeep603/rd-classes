import connectDB from "@/server/db/connect";
import { Course } from "@/server/db/models/Course";
import { Note } from "@/server/db/models/Note";
import { Settings as Setting } from "@/server/db/models/Settings";

const baseUrl = "https://www.rd-classes.in";

export default async function sitemap() {
  const now = new Date();
  let latestCourseDate = now;
  let latestNoteDate = now;
  let latestSettingsDate = now;
  let courses = [];

  try {
    await connectDB();
    const [cLatest, nLatest, sLatest, publishedCourses] = await Promise.all([
      Course.findOne({ published: true }).sort({ updatedAt: -1 }).select("updatedAt").lean(),
      Note.findOne({ published: true }).sort({ updatedAt: -1 }).select("updatedAt").lean(),
      Setting.findOne().sort({ updatedAt: -1 }).select("updatedAt").lean(),
      Course.find({ published: true }).select("slug updatedAt").lean(),
    ]);

    if (cLatest?.updatedAt) latestCourseDate = new Date(cLatest.updatedAt);
    if (nLatest?.updatedAt) latestNoteDate = new Date(nLatest.updatedAt);
    if (sLatest?.updatedAt) latestSettingsDate = new Date(sLatest.updatedAt);
    if (publishedCourses) courses = publishedCourses;
  } catch (err) {
    console.warn("Could not query DB for sitemap:", err?.message);
  }

  const routes = [
    {
      url: baseUrl,
      lastModified: latestSettingsDate,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: latestCourseDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...courses.map((c) => ({
      url: `${baseUrl}/courses/${c.slug}`,
      lastModified: c.updatedAt ? new Date(c.updatedAt) : latestCourseDate,
      changeFrequency: "weekly",
      priority: 0.9,
    })),
    {
      url: `${baseUrl}/notes`,
      lastModified: latestNoteDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/results`,
      lastModified: latestSettingsDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/gallery`,
      lastModified: latestSettingsDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: latestSettingsDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: latestSettingsDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  return routes;
}
