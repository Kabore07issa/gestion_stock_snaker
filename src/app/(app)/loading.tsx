import { Squelette } from "@/components/ui";

export default function Chargement() {
  return (
    <div aria-busy="true" aria-label="Chargement">
      <Squelette className="h-4 w-40" />
      <Squelette className="mt-3 h-10 w-72" />
      <div className="mt-12 grid grid-cols-2 gap-6 border-y border-trait py-8 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            <Squelette className="h-4 w-24" />
            <Squelette className="mt-3 h-9 w-36" />
          </div>
        ))}
      </div>
      <div className="mt-12 space-y-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <Squelette className="h-12 w-12 shrink-0" />
            <div className="flex-1">
              <Squelette className="h-4 w-2/3" />
              <Squelette className="mt-2 h-3 w-1/3" />
            </div>
            <Squelette className="h-5 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
