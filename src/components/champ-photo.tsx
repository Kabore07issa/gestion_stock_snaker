"use client";

import { useState } from "react";
import { ImagePlus, X } from "lucide-react";

export function ChampPhoto({ actuelle }: { actuelle: string | null }) {
  const [apercu, setApercu] = useState<string | null>(actuelle);
  const [retirer, setRetirer] = useState(false);

  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-semibold">Photo (facultatif)</span>
      <div className="flex items-center gap-4">
        <label className="relative flex aspect-square w-28 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-trait bg-surface text-doux transition-colors duration-150 hover:border-accent hover:text-accent">
          {apercu ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={apercu} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-6 w-6" strokeWidth={1.4} />
          )}
          <input
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setApercu(URL.createObjectURL(f));
                setRetirer(false);
              }
            }}
          />
        </label>
        <div className="text-sm text-doux">
          <p>JPG, PNG ou WEBP — 6 Mo max.</p>
          {apercu && (
            <button
              type="button"
              onClick={() => {
                setApercu(null);
                setRetirer(true);
              }}
              className="mt-2 inline-flex min-h-9 items-center gap-1 font-semibold text-erreur"
            >
              <X className="h-4 w-4" strokeWidth={1.75} /> Retirer la photo
            </button>
          )}
        </div>
      </div>
      <input type="hidden" name="retirerPhoto" value={retirer ? "1" : ""} />
    </div>
  );
}
