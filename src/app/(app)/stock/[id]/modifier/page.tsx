import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EnTete } from "@/components/ui";
import { FormulaireArticle } from "@/components/formulaire-article";
import { RetourLien } from "@/components/retour";

export default async function PageModifierArticle({ params }: { params: Promise<{ id: string }> }) {
  const article = await prisma.article.findUnique({ where: { id: Number((await params).id) || 0 } });
  if (!article) notFound();
  return (
    <>
      <RetourLien href={`/stock/${article.id}`}>{article.modele}</RetourLien>
      <EnTete titre="Modifier l'article" />
      <FormulaireArticle article={article} />
    </>
  );
}
