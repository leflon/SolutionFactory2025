import {
	getItineraryDijkstra,
	getMetroNetwork,
	getMinimumSpanningTree
} from '@/lib/Itinerary.server';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
	const from = req.nextUrl.searchParams.get('from');
	const to = req.nextUrl.searchParams.get('to');

	if (!from || !to) {
		return new Response(JSON.stringify({ error: 'Missing parameters' }), {
			status: 400
		});
	}

	const itinerary = getItineraryDijkstra(from, to);

	return new Response(JSON.stringify(itinerary));
}
