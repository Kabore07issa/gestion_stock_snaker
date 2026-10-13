import { exigerSession } from "@/lib/auth";
import { creditsARelancer } from "@/lib/requetes";
import { Navigation } from "@/components/navigation";
import { EnregistrerServiceWorker } from "@/components/enregistrer-sw";

export const dynamic = "force-dynamic";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const session = await exigerSession();
  const rappels = (await creditsARelancer()).length;

  return (
    <div className="min-h-dvh">
      <Navigation rappels={rappels} identifiant={session.identifiant} />
      <main className="pb-28 lg:pb-16 lg:pl-60">
        <div className="mx-auto w-full max-w-6xl px-4 pt-7 sm:px-8 sm:pt-10 lg:px-12 lg:pt-14">{children}</div>
      </main>
      <EnregistrerServiceWorker />
    </div>
  );
}
