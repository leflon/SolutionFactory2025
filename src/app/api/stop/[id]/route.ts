import db from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const getStop = db.prepare('SELECT * FROM Stops WHERE stop_id = ?');
	const stop = await getStop.get(id);
	if (!stop)
		return Response.json(
			{ error: 'Stop not found' },
			{
				status: 404
			}
		);
	return Response.json({ stop });
}
