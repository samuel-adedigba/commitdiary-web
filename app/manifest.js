export default function manifest() {
  return {
    name: "CommitDiary",
    short_name: "CommitDiary",
    description:
      "A developer work journal that turns Git history into clear engineering reports.",
    start_url: "/",
    display: "standalone",
    background_color: "#0c1110",
    theme_color: "#0c1110",
    icons: [
      {
        src: "/images/brand/commitdiary-mark-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/brand/commitdiary-mark-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
