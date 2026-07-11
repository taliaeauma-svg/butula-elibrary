export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/login"],
    },
    sitemap: "https://butula-elibrary-git-main-e-library1.vercel.app/sitemap.xml",
  };
}