import db from './db';
import {
	Itinerary,
	ItinerarySegment,
	MetroNetwork,
	MetroNetworkAdjacencyList,
	MetroNetworkEdge,
	MetroNetworkNode
} from './types';
import { timeStringToSeconds } from './utils';

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

//#region Metro graph construction

// Cached metroNetwork
let metroNetwork: MetroNetwork | null = null;

export function getMetroNetwork(): MetroNetwork {
	if (metroNetwork) return metroNetwork;

	const nodes: Record<string, MetroNetworkNode> = {};
	const edges: MetroNetworkAdjacencyList = {};

	type Row = {
		current_stop_id: string;
		current_stop_name: string;
		current_latitude: number;
		current_longitude: number;
		current_parent_station: string;
		current_departure_time: string;
		current_line_id: string;
		current_line_name: string;
		current_line_color: string;

		next_stop_id: string;
		next_departure_time: string;
	};
	const getTimings = db.prepare(
		`
		SELECT
			st.stop_id AS current_stop_id,
			s.name as current_stop_name,
			s.latitude as current_latitude,
			s.longitude as current_longitude,
			s.parent_station as current_parent_station,
			min(st.departure_time) AS current_departure_time,
			r.route_id as current_line_id,
			r.name as current_line_name,
			r.background_color as current_line_color,

			st2.stop_id AS next_stop_id,
			min(st2.departure_time) AS next_departure_time
		FROM
			StopTimes st
		JOIN
			Stops s ON st.stop_id = s.stop_id
		JOIN
			Trips t ON st.trip_id = t.trip_id
		JOIN
			Routes r ON r.route_id = t.route_id
		JOIN
			StopTimes st2 ON st.trip_id = st2.trip_id
			AND st.stop_sequence = st2.stop_sequence - 1
		WHERE
			st.departure_time IS NOT NULL AND st2.departure_time IS NOT NULL
		GROUP BY
			current_stop_id,
			next_stop_id
		ORDER BY
			st.trip_id, st.stop_sequence
	`
	);

	const timings = getTimings.all() as Row[];
	for (const timing of timings) {
		if (!nodes[timing.current_stop_id]) {
			nodes[timing.current_stop_id] = {
				id: timing.current_stop_id,
				name: timing.current_stop_name,
				latitude: timing.current_latitude,
				longitude: timing.current_longitude,
				parentId: timing.current_parent_station,
				line: {
					id: timing.current_line_id,
					name: timing.current_line_name,
					color: timing.current_line_color
				}
			};
		}
		if (!edges[timing.current_stop_id]) {
			edges[timing.current_stop_id] = [];
		}
		const duration =
			timeStringToSeconds(timing.next_departure_time) -
			timeStringToSeconds(timing.current_departure_time);
		edges[timing.current_stop_id].push({
			fromId: timing.current_stop_id,
			toId: timing.next_stop_id,
			duration
		});
	}
	metroNetwork = {
		nodes,
		edges
	};
	return metroNetwork;
}
