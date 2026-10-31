export default function robots() {
  const baseUrl = "https://www.rd-classes.in";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/student",
        "/student/",
        "/api",
        "/api/",
        "/student-login",
        "/student/login",
        "/admin-login",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
