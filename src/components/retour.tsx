import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function RetourLien({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="no-print -ml-1 mb-5 inline-flex min-h-9 items-center gap-1.5 rounded-md px-1 text-sm font-semibold text-doux transition-colors duration-150 hover:text-accent"
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
      {children}
    </Link>
  );
}
