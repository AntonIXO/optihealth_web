/**
 * Extracts the original origin from a request behind a reverse proxy.
 * Next.js behind nginx sees request.url as http://127.0.0.1:3000,
 * so we need to reconstruct it from x-forwarded-* headers.
 */
export function getOriginFromRequest(request: Request): string {
  const proto = request.headers.get('x-forwarded-proto') ?? 'https'
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? 'localhost'
  return `${proto}://${host}`
}
