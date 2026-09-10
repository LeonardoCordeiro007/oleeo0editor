import { createFileRoute } from "@tanstack/react-router";

import { PortfolioPage } from "@/components/ui/PortfolioPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Oleeo0 Editor — Portfólio de Edição de Vídeo" },
      {
        name: "description",
        content:
          "Portfólio de edição de vídeo: projetos em formato curto e longo, com ritmo, cor e intenção.",
      },
      {
        property: "og:title",
        content: "Oleeo0 Editor — Portfólio de Edição de Vídeo",
      },
      {
        property: "og:description",
        content:
          "Projetos em formato curto e longo editados com ritmo, cor e intenção.",
      },
    ],
    links: [
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico?v=2" },
      { rel: "icon", type: "image/png", href: "/favicon.png?v=2" },
      { rel: "apple-touch-icon", href: "/favicon.png?v=2" },
    ],
  }),
  component: PortuguesePortfolio,
});

function PortuguesePortfolio() {
  return <PortfolioPage lang="pt" />;
}
