import db from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
	const stmt = db.prepare(`
		SELECT
			s.stop_id,
			s.name,
			s.longitude,
			s.latitude,
			GROUP_CONCAT(DISTINCT r.name) AS route_names,
			GROUP_CONCAT(DISTINCT r.background_color) AS route_colors,
			GROUP_CONCAT(DISTINCT r.text_color) AS route_text_colors
			FROM Stops s
			JOIN StopTimes st ON s.stop_id = st.stop_id
			JOIN Trips t ON st.trip_id = t.trip_id
			JOIN Routes r ON t.route_id = r.route_id
			WHERE s.latitude IS NOT NULL AND s.longitude IS NOT NULL
			GROUP BY s.name
`);

	const rows = stmt.all() as {
		stop_id: string;
		name: string;
		latitude: number;
		longitude: number;
		route_names: string;
		route_colors: string;
		route_text_colors: string;
	}[];

	return Response.json({
		stops: rows.map((row) => ({
			...row,
			route_names: row.route_names.split(','),
			route_colors: row.route_colors.split(','),
			route_text_colors: row.route_text_colors.split(',')
		}))
	});
}
