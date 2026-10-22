const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rd-classes.in";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/student", "/student/", "/admin", "/admin/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
