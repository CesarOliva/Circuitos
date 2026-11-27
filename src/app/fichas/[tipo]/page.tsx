import { redirect } from "next/navigation";

export default async function FichaRedirect({ params }: PageProps<"/fichas/[tipo]">) {
  const { tipo } = await params;
  redirect(`/componentes/${tipo}`);
}
