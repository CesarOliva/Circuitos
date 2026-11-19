import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-black">
      <div className="flex w-full max-w-sm flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Iniciar sesión
        </h1>

        <form className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Correo
            <input
              type="email"
              name="email"
              autoComplete="email"
              className="h-11 rounded-lg border border-zinc-300 bg-transparent px-3 text-zinc-900 dark:border-zinc-700 dark:text-zinc-50"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            Contraseña
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              className="h-11 rounded-lg border border-zinc-300 bg-transparent px-3 text-zinc-900 dark:border-zinc-700 dark:text-zinc-50"
            />
          </label>
          <button
            type="button"
            disabled
            className="h-11 rounded-full bg-zinc-900 font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900"
          >
            Entrar
          </button>
        </form>

        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          El inicio de sesión se activará cuando la base de datos esté lista.
        </p>
        <Link href="/" className="text-sm font-medium text-zinc-900 underline dark:text-zinc-50">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
