export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const response = await fetch(`${process.env.LARAVEL_API_URL || 'http://127.0.0.1:8001'}/api/v1/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return Response.json({ status: 'unavailable', database: 'unavailable' }, { status: 503 });
    const body: unknown = await response.json();
    if (typeof body !== 'object' || body === null || !('status' in body) || body.status !== 'ok') {
      return Response.json({ status: 'unavailable', database: 'unavailable' }, { status: 503 });
    }
    return Response.json({ status: 'ok', database: 'connected' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ status: 'unavailable', database: 'unavailable' }, { status: 503 });
  }
}
