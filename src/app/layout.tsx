import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import "@/components/site/site.css";
import { SiteHeader } from "@/components/site/site-header";
import { SpotlightTracker } from "@/components/site/spotlight-tracker";

export const metadata: Metadata = {
  title: {
    default: "Circuitos — Simulador de electrónica",
    template: "%s · Circuitos",
  },
  description:
    "Arma un circuito en la protoboard, simúlalo y examina cada componente en isométrico y 3D, con sus fallos reales.",
};

// Aplica el tema guardado en la cookie antes del primer pintado, sin sacar la página del prerender estático.
const THEME_INIT = `(function(){try{var m=document.cookie.match(/(?:^|; )theme=([^;]*)/);if(m)document.documentElement.setAttribute("data-theme",decodeURIComponent(m[1]))}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      data-theme="dark"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_INIT }}
        />
        <SiteHeader />
        <SpotlightTracker />
        {children}
      </body>
    </html>
  );
}
