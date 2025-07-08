import db from '@/lib/db';

export async function GET(
    req: Request,
    context: { params: Promise<{ name: string}> }
) {
    const params = await context.params;
    console.log(params.name);

    // Query the Stops table for the stop_id by name
    const row = db.prepare(`SELECT stop_id FROM Stops WHERE name = ?`).get(params.name) as { stop_id: string } | undefined;
    if (!row) {
        return new Response(JSON.stringify({ error: 'Station not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ stop_id: row.stop_id }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}