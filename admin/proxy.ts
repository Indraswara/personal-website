// Second auth layer, on top of Cloudflare Access itself. Access blocks
// unauthenticated browsers at Cloudflare's edge before they ever reach this
// origin — but that's a perimeter control, not proof for *this process*.
// Anyone who can reach the origin directly (a misconfigured ingress, a bug
// in Access, a request crafted with a stale/forged header) would otherwise
// walk straight past it. This proxy independently verifies the JWT Access
// attaches to every authenticated request, and fails closed: no
// valid token, no admin, no exceptions — including in dev, where
// CF_ACCESS_TEAM_DOMAIN/CF_ACCESS_AUD simply won't be set yet.
import { NextRequest, NextResponse } from "next/server";
import { createRemoteJWKSet, jwtVerify } from "jose";

const TEAM_DOMAIN = process.env.CF_ACCESS_TEAM_DOMAIN;
const AUD = process.env.CF_ACCESS_AUD;

const JWKS = TEAM_DOMAIN
  ? createRemoteJWKSet(new URL(`https://${TEAM_DOMAIN}.cloudflareaccess.com/cdn-cgi/access/certs`))
  : null;

export async function proxy(req: NextRequest) {
  // Cloudflare Access sets this on every request it lets through, once the
  // visitor has completed the Access login flow — both as a header (what we
  // check) and as the CF_Authorization cookie (same JWT, browser-facing).
  const token = req.headers.get("Cf-Access-Jwt-Assertion");

  if (!TEAM_DOMAIN || !AUD || !JWKS) {
    return unauthorized("Access is not configured on this deployment yet (CF_ACCESS_TEAM_DOMAIN / CF_ACCESS_AUD missing)");
  }
  if (!token) {
    return unauthorized("missing Access assertion — this origin must be reached through Cloudflare Access");
  }

  try {
    await jwtVerify(token, JWKS, {
      issuer: `https://${TEAM_DOMAIN}.cloudflareaccess.com`,
      audience: AUD,
    });
  } catch (err) {
    return unauthorized(`Access assertion failed verification: ${(err as Error).message}`);
  }

  return NextResponse.next();
}

function unauthorized(reason: string) {
  return NextResponse.json({ error: "unauthorized", reason }, { status: 401 });
}

export const config = {
  // Everything except Next's own static assets — there is no "public" route
  // in this app, unlike site/. A 401 JSON body for a missing icon is fine;
  // an admin page or API route slipping through is not.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
