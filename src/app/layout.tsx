import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import "@/components/site/site.css";
import { SiteHeader } from "@/components/site/site-header";

export const metadata: Metadata = {
  title: {
    default: "Circuitos — Simulador de electrónica",
    template: "%s · Circuitos",
  },
  description:
    "Arma un circuito en la protoboard, simúlalo y examina cada componente en isométrico y 3D, con sus fallos reales.",
};

const plexSans = IBM_Plex_Sans({ subsets: ["latin", "latin-ext"], weight: "variable", variable: "--font-plex-sans" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600"], variable: "--font-plex-mono" });

// Aplica el tema guardado en la cookie antes del primer pintado, sin sacar la página del prerender estático.
const THEME_INIT = `(function(){try{var m=document.cookie.match(/(?:^|; )theme=([^;]*)/);if(m)document.documentElement.setAttribute("data-theme",decodeURIComponent(m[1]))}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      data-theme="dark"
      suppressHydrationWarning
      className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
