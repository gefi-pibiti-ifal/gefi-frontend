/**
 * Endpoint de liveness do container.
 *
 * Consumido pelo HEALTHCHECK do Dockerfile e pelo healthcheck do compose.
 * Nao toca no backend de proposito: responde se ESTE processo esta de pe. Um
 * healthcheck que dependesse da API derrubaria o front toda vez que o backend
 * oscilasse, e o orquestrador reiniciaria o container errado.
 */
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json(
    { status: 'ok', uptime: process.uptime() },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
