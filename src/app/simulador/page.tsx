import type { Metadata } from "next";
import Playground from "@/components/playground";

export const metadata: Metadata = {
  title: "Simulador",
  description: "Arma un circuito, conecta sus componentes y observa qué ocurre.",
};

export default function SimuladorPage() {
  return <Playground />;
}
