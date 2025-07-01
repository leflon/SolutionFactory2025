import { NextRequest } from "next/server";
import db from '@/lib/db';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
        const metroLineId = await Promise.resolve(params.id);
        type StationRow = { stop_id: number; stop_name: string };
        const stmt = db.prepare(`
                SELECT 
                    s.stop_id,
                    s.name AS stop_name
                FROM Stops s
        `).all(metroLineId) as StationRow[];

        if (!stmt || stmt.length === 0) {
                return Response.json({ error: 'No stations found for the specified metro line.' }, { status: 404 });
        }

        const stations = stmt.map((row) => ({
                stop_id: row.stop_id,
                stop_name: row.stop_name,
        }));

        return Response.json({ stations });
}