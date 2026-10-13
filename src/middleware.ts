import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSION, lireSession } from "@/lib/session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await lireSession(req.cookies.get(COOKIE_SESSION)?.value);

  if (pathname.startsWith("/connexion")) {
    if (session) return NextResponse.redirect(new URL("/", req.url));
    return NextResponse.next();
  }

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ erreur: "Non connecté" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/connexion", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|icons/|logo|manifest.webmanifest|sw.js|robots.txt).*)",
  ],
};
