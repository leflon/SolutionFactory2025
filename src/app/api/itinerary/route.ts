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

	const itineraryDuration = getItineraryDijkstra(from, to, 'duration');
	const itineraryTransfers = getItineraryDijkstra(from, to, 'transfers');
	if (!itineraryTransfers || !itineraryDuration) {
		return new Response(JSON.stringify({ error: 'No itinerary found' }), {
			status: 404
		});
	}
	let returned = [itineraryDuration];
	if (itineraryTransfers.segments.length < itineraryDuration.segments.length)
		returned.push(itineraryTransfers);

	return Response.json(returned);
}
