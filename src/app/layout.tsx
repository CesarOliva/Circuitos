import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Circuitos — Playground",
  description: "Arma un circuito, conecta sus componentes y observa qué ocurre.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
