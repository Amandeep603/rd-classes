export default function manifest() {
  return {
    name: "R.D. Classes for Accountancy",
    short_name: "RD Classes",
    description: "Premier Accountancy coaching for CBSE Class 11 & 12 in Sector 9, Faridabad, Haryana.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0A0B",
    theme_color: "#FFB800",
    icons: [
      {
        src: "/images/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/images/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}

