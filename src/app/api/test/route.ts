// This is a test API route. Delete it later.
import db from '@/lib/db';
// Get a random stop from the database
const query = db.prepare('SELECT * FROM Stops ORDER BY RANDOM() LIMIT 1');
export async function GET() {
	const stop = query.get();
	console.log(stop);
	return Response.json({ message: 'Hello World', stop: stop ? stop : 'No stop found' });
}
