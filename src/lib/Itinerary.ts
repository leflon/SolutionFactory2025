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

export function getTotalDuration(itinerary: Itinerary): number {
	return itinerary.segments.reduce((acc, segment) => acc + segment.stops.reduce((acc, stop) => acc + stop.duration, 0), 0);
}

export function getTotalDistance(itinerary: Itinerary): number {
	return itinerary.segments.reduce((acc, segment) => acc + segment.stops.reduce((acc, stop) => acc + stop.distance, 0), 0);
}

export function getTotalWalkingDuration(itinerary: Itinerary): number {
	return itinerary.segments.reduce((acc, segment) => acc + (segment.connectingDuration ?? 0), 0);
}

export function getTotalStops(itinerary: Itinerary): number {
	return itinerary.segments.reduce((acc, segment) => acc + segment.stops.length, 0);
}

export function getTotalTransfers(itinerary: Itinerary): number {
	return itinerary.segments.length - 1;
}
