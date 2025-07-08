import { Itinerary, ItinerarySegment, MetroNetwork } from './types';

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

export function dateToTimeString(date: Date): string {
	date.setSeconds(0); // Seconds are alway set to 0 in IDFM metro timings.
	date.setMinutes(date.getMinutes() + 1); // Avoids inconsistencies and adds a layer of safety to avoid users from being late.
	const str = date.toLocaleTimeString('en-US', { hour12: false });
	const hours = date.getHours();
	if (hours > 0 && hours < 3) {
		return `${hours + 24}:${str.slice(3)}`;
	}
	return str;
}
export function timeStringToDate(timeString: string): Date {
	let [hours, minutes, seconds] = timeString.split(':').map((s) => +s);
	const date = new Date();
	if (hours > 24) {
		date.setDate(date.getDate() + 1);
		hours -= 24;
	}
	date.setHours(hours);
	date.setMinutes(minutes);
	date.setSeconds(seconds);
	return date;
}

export function distance(from: [number, number], to: [number, number]): number {
	const [lon1, lat1] = from;
	const [lon2, lat2] = to;

	const R = 6371000; // Earth's radius in meters
	const φ1 = (lat1 * Math.PI) / 180; // φ, λ in radians
	const φ2 = (lat2 * Math.PI) / 180;
	const Δφ = ((lat2 - lat1) * Math.PI) / 180;
	const Δλ = ((lon2 - lon1) * Math.PI) / 180;

	const a =
		Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
		Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return R * c; // Distance in meters
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

export function getTotalDistance(segments: ItinerarySegment[]): number {
	return segments.reduce(
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

export function isConnected(network: MetroNetwork): boolean {
	const nodeIds = Object.keys(network.nodes);
	if (nodeIds.length === 0) {
		return true; // An empty graph is considered connected.
	}

	const visited = new Set<string>();
	const queue: string[] = [nodeIds[0]]; // Start BFS from the first node.
	visited.add(nodeIds[0]);

	let head = 0;
	while (head < queue.length) {
		const currentNodeId = queue[head++];

		// Check outgoing edges
		const outgoingEdges = network.edges[currentNodeId] || [];
		for (const edge of outgoingEdges) {
			if (!visited.has(edge.toId)) {
				visited.add(edge.toId);
				queue.push(edge.toId);
			}
		}

		// To handle an undirected graph for connectivity, we also need to check incoming edges
		// because the graph is represented as a directed adjacency list.
		// This is slow, but necessary if we can't build a reverse adjacency list.
		for (const fromId in network.edges) {
			for (const edge of network.edges[fromId]) {
				if (edge.toId === currentNodeId && !visited.has(fromId)) {
					visited.add(fromId);
					queue.push(fromId);
				}
			}
		}
	}

	return visited.size === nodeIds.length;
}
