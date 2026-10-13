import { BOUTIQUE } from "@/config";
import { urlPhoto } from "@/lib/photos";
import { MarqueSneaker } from "./logo";
import { Badge, cx } from "./ui";

export function BadgeStock({ quantite }: { quantite: number }) {
  if (quantite <= 0) return <Badge ton="erreur">Rupture</Badge>;
  if (quantite <= BOUTIQUE.seuilStockFaible) return <Badge ton="alerte">Stock faible</Badge>;
  return null;
}

export function Vignette({ photo, className, alt = "" }: { photo: string | null; className?: string; alt?: string }) {
  const url = urlPhoto(photo);
  return (
    <div className={cx("relative overflow-hidden bg-surface", className)}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={alt} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <MarqueSneaker className="w-1/2 max-w-[120px] text-accent/35" epaisseur={1.2} />
        </div>
      )}
    </div>
  );
}
