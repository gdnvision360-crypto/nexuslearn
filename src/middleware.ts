import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth/signin",
  },
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /auth/* (authentication pages)
     * - /api/auth/* (NextAuth API routes)
     * - /_next/static (static files)
     * - /_next/image (image optimization)
     * - /favicon.ico, /robots.txt, /sitemap.xml
     * - / (landing page)
     */
    "/((?!auth|api/auth|_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|$).*)",
  ],
};
