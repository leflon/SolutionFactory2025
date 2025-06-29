import db from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const q = searchParams.get('q')?.toLowerCase() || '';

	if (!q) {
		return Response.json(
			{ error: 'Missing query parameter "q"' },
			{ status: 400 },
		);
	}

	// Grab the stations from the database
	// GROUP_CONCAT(stop_id) as stop_ids,
	const stmt = db.prepare(`
    SELECT
    	s.stop_id,
        s.name AS stop_name,
        GROUP_CONCAT(DISTINCT r.name) AS route_names
    FROM Stops s
    JOIN StopTimes st ON s.stop_id = st.stop_id
    JOIN Trips t ON st.trip_id = t.trip_id
    JOIN Routes r ON t.route_id = r.route_id
    WHERE LOWER(s.name) LIKE ?
    GROUP BY s.name;
  `);

	type Row = {
		stop_id: string;
		stop_name: string;
		route_names: string;
	};
	// Use %q% instead of q% to match anywhere in the stop name
	const rows = stmt.all(`%${q}%`) as Row[];

	// Formatting the result
	const stops = rows.map((row) => ({
		stop_id: row.stop_id,
		stop_name: row.stop_name,
		route_names: row.route_names ? row.route_names.split(',') : [],
	}));

	return Response.json({ stops });
}
