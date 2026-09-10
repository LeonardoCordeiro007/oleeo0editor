import { createFileRoute } from "@tanstack/react-router";

import { PortfolioPage } from "@/components/ui/PortfolioPage";

export const Route = createFileRoute("/en")({
  head: () => ({
    meta: [
      { title: "Oleeo0 Editor — Video Editing Portfolio" },
      {
        name: "description",
        content:
          "Video editing portfolio with short-form and long-form projects focused on rhythm, color and intention.",
      },
      {
        property: "og:title",
        content: "Oleeo0 Editor — Video Editing Portfolio",
      },
      {
        property: "og:description",
        content:
          "Short-form and long-form video editing projects with rhythm, color and intention.",
      },
    ],
    links: [
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico?v=2" },
      { rel: "icon", type: "image/png", href: "/favicon.png?v=2" },
      { rel: "apple-touch-icon", href: "/favicon.png?v=2" },
    ],
  }),
  component: EnglishPortfolio,
});

function EnglishPortfolio() {
  return <PortfolioPage lang="en" />;
}
