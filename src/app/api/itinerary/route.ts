import { getItineraryWithDepartureTime } from '@/lib/Itinerary.server';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
	const from = req.nextUrl.searchParams.get('from');
	const to = req.nextUrl.searchParams.get('to');
	let departureTime = req.nextUrl.searchParams.get('departureTime');

	if (!from || !to || !departureTime) {
		return new Response(JSON.stringify({ error: 'Missing parameters' }), {
			status: 400
		});
	}

	// Accept trips between midnight and ~3am, which are coded as 24:00, 25:00, 26:00, etc.
	const timeSplit = departureTime.split(':');
	let hours = parseInt(timeSplit[0]);
	if (hours >= 0 && hours < 3) {
		hours += 24;
		timeSplit[0] = String(hours);
	}
	departureTime = timeSplit.join(':');
	console.log({ departureTime });

	const itineraryDuration = getItineraryWithDepartureTime(
		departureTime,
		from,
		to,
		'duration'
	);
	const itineraryTransfers = getItineraryWithDepartureTime(
		departureTime,
		from,
		to,
		'transfers'
	);
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
