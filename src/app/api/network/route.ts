import {
	getItineraryDijkstra,
	getMetroNetwork,
	getMinimumSpanningTree
} from '@/lib/Itinerary.server';
import { NextRequest } from 'next/server';
import { Network } from 'node:inspector/promises';

export async function GET(req: NextRequest) {
	return Response.json(getMetroNetwork());
}
