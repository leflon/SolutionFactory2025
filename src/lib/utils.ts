import { Itinerary, ItinerarySegment } from './types';

/**
 * Normalize a string by decomposing accented characters, removing diacritics,
 * removing all non-alphanumeric characters, and converting to lowercase.
 * @param str The string to normalize
 * @returns The normalized string
 */
export function normalizeString(str: string) {
	return str
		.normalize('NFD') // Decompose accented characters
		.replace(/[\u0300-\u036f]/g, '') // Remove diacritics
		.replace(/[^a-zA-Z0-9]/g, '') // Remove all non-alphanumeric characters
		.toLowerCase();
}

export function timeStringToSeconds(timeString: string): number {
	const [hours, minutes, seconds] = timeString.split(':').map((s) => +s);
	return hours * 3600 + minutes * 60 + seconds;
}

//#region Itinerary Datatype helper functions
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
//#endregion
