import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { nomClient } from "@/lib/format";
import { EnTete } from "@/components/ui";
import { FormulaireClient } from "@/components/formulaire-client";
import { RetourLien } from "@/components/retour";

export default async function PageModifierClient({ params }: { params: Promise<{ id: string }> }) {
  const client = await prisma.client.findUnique({ where: { id: Number((await params).id) || 0 } });
  if (!client) notFound();
  return (
    <>
      <RetourLien href={`/clients/${client.id}`}>{nomClient(client)}</RetourLien>
      <EnTete titre="Modifier le client" />
      <FormulaireClient client={client} />
    </>
  );
}
