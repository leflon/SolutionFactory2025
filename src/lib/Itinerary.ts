export interface ItinerarySegment {
	/* The stops in this segment */
	stops: {
		/* The id of the stop */
		id: string;
		/* The name of the stop */
		name: string;
		/*
		 * The time in seconds between the previous stop and this stop.
		 * 0 if first stop of the segment.
		 */
		duration: number;
		/* The distance in meters between the previous stop and this stop */
		distance: number;
	}[];
	/* The line of the segment */
	line: string;
	/* The color of the line in hex format */
	lineColor: string;
	/* The direction to take on the line for this segment */
	direction: string;
	/* The time in seconds it takes to change lines from the previous segment to this segment */
	connectingDuration?: number;
}

export interface Itinerary {
	/* The departure time requested by the user */
	requestedDeparturTime?: Date;
	/* The arrival time request by the user */
	requestedArrivalTime?: Date;
	/* The segments making up the itinerary */
	segments: ItinerarySegment[];
}

export function getSegmentDurationInMinutes(segment: ItinerarySegment): number {
	// Rounding up to the nearest minute, we rather have a longer duration than a shorter one
	// It avoids underestimating the time needed for an itinerary.
	return Math.ceil(
		segment.stops.reduce((acc, stop) => acc + stop.duration, 0) / 60
	);
}

export function getTotalDuration(itinerary: Itinerary): number {
	return itinerary.segments.reduce(
		(acc, segment) =>
			acc +
			segment.stops.reduce((acc, stop) => acc + stop.duration, 0) +
			(segment.connectingDuration ?? 0),
		0
	);
}

export function getTotalDistance(itinerary: Itinerary): number {
	return itinerary.segments.reduce(
		(acc, segment) =>
			acc + segment.stops.reduce((acc, stop) => acc + stop.distance, 0),
		0
	);
}

export function getTotalWalkingDuration(itinerary: Itinerary): number {
	return itinerary.segments.reduce(
		(acc, segment) => acc + (segment.connectingDuration ?? 0),
		0
	);
}

export function getTotalStops(itinerary: Itinerary): number {
	return itinerary.segments.reduce(
		(acc, segment) => acc + segment.stops.length,
		0
	);
}

export function getTotalTransfers(itinerary: Itinerary): number {
	return itinerary.segments.length - 1;
}

/** **Waiting for API implementation** */
export const PLACEHOLDER_ITINERARY: Itinerary = {
	segments: [
		{
			stops: [
				{
					id: 'stop1',
					name: 'Denfert-Rochereau',
					distance: 0,
					duration: 0
				},
				{
					id: 'stop2',
					name: 'Saint-Jacques',
					distance: 500,
					duration: 40
				},
				{
					id: 'stop3',
					name: 'Glacière',
					distance: 300,
					duration: 30
				},
				{
					id: 'stop4',
					name: 'Corvisart',
					distance: 600,
					duration: 50
				},
				{
					id: 'stop5',
					name: 'Place d\Italie',
					distance: 400,
					duration: 35
				}
			],
			line: '6',
			lineColor: '#6ECA97',
			direction: 'Nation'
		},
		{
			line: '7',
			lineColor: '#F49FB3',
			direction: 'Villejuif - Louis Aragon',
			connectingDuration: 120,
			stops: [
				{
					id: 'stop6',
					name: "Place d'Italie",
					distance: 0,
					duration: 0
				},
				{
					id: 'stop7',
					name: 'Tolbiac',
					distance: 300,
					duration: 25
				},
				{
					id: 'stop8',
					name: 'Maison Blanche',
					distance: 400,
					duration: 30
				},
				{
					id: 'stop9',
					name: 'Le Kremlin-Bicetre',
					distance: 500,
					duration: 40
				},
				{
					id: 'stop10',
					name: 'Villejuif - Leo Lagrange',
					distance: 600,
					duration: 50
				},
				{
					id: 'stop11',
					name: 'Villejuif - Paul Vaillant-Couturier',
					distance: 700,
					duration: 60
				},
				{
					id: 'stop12',
					name: 'Villejuif - Louis Aragon',
					distance: 800,
					duration: 70
				}
			]
		}
	]
};
