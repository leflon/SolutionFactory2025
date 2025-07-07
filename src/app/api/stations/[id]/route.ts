import db from '@/lib/db';

export async function GET(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
        const params = await context.params;
        type StationRow = { name: string };
        const metroLineIDFM = db.prepare(`
                SELECT route_id, background_color, text_color
                FROM Routes
                WHERE name = ?
        `).get(params.id.toUpperCase()) as { route_id: number, background_color: string, text_color: string } | undefined;
        const stmt = db.prepare(`
                SELECT Stops.name
                FROM StopTimes
                JOIN Stops ON Stops.stop_id = StopTimes.stop_id
                WHERE StopTimes.trip_id = (
                SELECT trip_id
                FROM Trips
                WHERE route_id = ?
                ORDER BY (
                        SELECT COUNT(*) FROM StopTimes WHERE StopTimes.trip_id = Trips.trip_id
                ) DESC
                LIMIT 1
                )
                ORDER BY StopTimes.stop_sequence;`).all(metroLineIDFM?.route_id) as StationRow[];

        if (!stmt || stmt.length === 0) {
                return Response.json({ error: 'No stations found for the specified metro line.' }, { status: 404 });
        }

        const stations = stmt.map(row => row.name);

        return Response.json({"color": metroLineIDFM?.background_color, "text_color": metroLineIDFM?.text_color, stations });
}