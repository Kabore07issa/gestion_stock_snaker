import { Squelette } from "@/components/ui";

export default function ChargementStock() {
  return (
    <div aria-busy="true" aria-label="Chargement">
      <Squelette className="h-10 w-40" />
      <Squelette className="mt-3 h-4 w-72" />
      <Squelette className="mt-10 h-11 w-full" />
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i}>
            <Squelette className="aspect-square w-full" />
            <Squelette className="mt-3 h-3 w-16" />
            <Squelette className="mt-2 h-4 w-3/4" />
            <Squelette className="mt-2 h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
