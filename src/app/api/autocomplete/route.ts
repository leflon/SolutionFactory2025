import db  from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.toLowerCase() || '';

  if (!q) {
    return Response.json({ error: 'Missing query parameter "q"' }, { status: 400 });
  }

  // Grab the stations from the database
  // GROUP_CONCAT(stop_id) as stop_ids, 
  const stmt = db.prepare(`
    SELECT 
      name, 
      MAX(wheelchair_accessible) as wheelchair_accessible
    FROM Stops
    WHERE LOWER(name) LIKE ?
    GROUP BY name
    ORDER BY name
    LIMIT 10
  `);

  const rows = stmt.all(`${q}%`);

  // Formating the result 
  const stations = rows.map(row => {
    const r = row as { name: string; wheelchair_accessible: number };
    return {
      name: r.name,
      wheelchair_accessible: !!r.wheelchair_accessible
    };
  });

  return Response.json({ stations });
}