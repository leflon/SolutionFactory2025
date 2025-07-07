import {
	getItineraryDijkstra,
	getMetroNetwork,
	getMinimumSpanningTree
} from '@/lib/Itinerary.server';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
	return new Response(JSON.stringify(getMetroNetwork()));
}
