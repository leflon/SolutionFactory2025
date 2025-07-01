import Database from 'better-sqlite3';
const db = new Database('data/db.sqlite');

export default db;

/* Export data fetching/formatting/insertion logic here if it becomes too complex to be in other components. */

export function getStopLine(stopId: string): { id: string; name: string } {
	const line = db
		.prepare(
			`SELECT
     	r.route_id,
      r.name
    FROM Stops s
    JOIN StopTimes st ON s.stop_id = st.stop_id
    JOIN Trips t ON st.trip_id = t.trip_id
    JOIN Routes r ON t.route_id = r.route_id
    WHERE s.stop_id = ?`
		)
		.get(stopId);
	console.log(line);
	return line as { id: string; name: string };
}
