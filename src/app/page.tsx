import Link from "next/link";
import CircuitLab from "@/components/circuit-lab";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      <header className="flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Circuitos
        </h1>
        <Link
          href="/login"
          className="h-10 rounded-full border border-zinc-300 px-5 leading-10 text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
        >
          Iniciar sesión
        </Link>
      </header>

      <main className="flex w-full flex-1 flex-col items-center px-6 pb-16">
        <p className="mb-6 w-full max-w-6xl text-zinc-600 dark:text-zinc-400">
          Sube una foto de un circuito. La IA segmentará sus componentes y te guiará paso a paso.
        </p>
        <CircuitLab />
      </main>
    </div>
  );
}
