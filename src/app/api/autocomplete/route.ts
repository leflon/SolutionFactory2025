import db  from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  //Reduce the query to lowercase for case-insensitive search
  // and ensure it is not empty
  const q = searchParams.get('q')?.toLowerCase() || '';

  if (!q) {
    return Response.json({ error: 'Missing query parameter "q"' }, { status: 400 });
  }

  // Use parameterized LIKE query for prefix matching, limit to 10 results
  // Make sure to have distinct results to avoid duplicates
  const stmt = db.prepare(
    'SELECT DISTINCT name FROM Stops WHERE LOWER(name) LIKE ? ORDER BY name LIMIT 10'
  );
  const stations = stmt.all(`${q}%`);

  return Response.json({ stations });
}