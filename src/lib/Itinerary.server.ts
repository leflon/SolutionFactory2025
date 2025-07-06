import { PriorityQueue } from '@datastructures-js/priority-queue';
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

/**
 * Returns the metro network as a graph
 */
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
			duration,
			isTransfer: false
		});
	}

	// Get transfers
	const transfers = db
		.prepare(
			`
		SELECT * FROM Transfers t
		JOIN
			Stops s1 ON t.from_id = s1.stop_id
		JOIN
		  Stops s2 ON t.to_id = s2.stop_id
		WHERE s1.parent_station = s2.parent_station
		`
		)
		.all() as {
		from_id: string;
		to_id: string;
		duration: number;
	}[];

	for (const transfer of transfers) {
		if (!edges[transfer.from_id]) {
			edges[transfer.from_id] = [];
		}
		if (!edges[transfer.to_id]) {
			edges[transfer.to_id] = [];
		}
		edges[transfer.from_id].push({
			fromId: transfer.from_id,
			toId: transfer.to_id,
			duration: transfer.duration,
			isTransfer: true
		});
		edges[transfer.to_id].push({
			fromId: transfer.to_id,
			toId: transfer.from_id,
			duration: transfer.duration,
			isTransfer: true
		});
	}

	metroNetwork = {
		nodes,
		edges
	};
	return metroNetwork;
}

interface PrimQueueEntry {
	weight: number;
	fromNodeId: string | null; // The node from which this edge originates (for building the MST)
	toNodeId: string; // The node to which this edge leads
}

/**
 * Implements Prim's algorithm to find the Minimum Spanning Tree (MST) of a MetroNetwork.
 * This implementation assumes the graph is *unidirectional* as per MetroNetworkEdge definition,
 * but for Prim's to work correctly on a connected graph, it effectively treats edges as traversable
 * in both directions for finding minimum connections. The resulting MST will contain
 * the specific unidirectional edges chosen.
 *
 * @param network The input metro network.
 * @returns A MetroNetwork representing the MST, or null if the network is empty.
 */
export function getMinimumSpanningTree(): MetroNetwork | null {
	const network = getMetroNetwork();
	const nodeIds = Object.keys(network.nodes);

	if (nodeIds.length === 0) {
		return null; // No nodes, no MST.
	}

	// Structure to store the resulting MST
	const mst: MetroNetwork = {
		nodes: {},
		edges: {}
	};

	// Set of nodes already included in the MST
	const inMST: Set<string> = new Set();

	// Priority queue to store edges, ordered by their duration (weight)
	// The queue will contain objects of type PrimQueueEntry
	const pq = new PriorityQueue<PrimQueueEntry>((a, b) => a.weight - b.weight);

	// Start Prim's algorithm from an arbitrary node (the first one found)
	const startNodeId = nodeIds[0];

	// Add the starting node to the MST
	inMST.add(startNodeId);
	mst.nodes[startNodeId] = network.nodes[startNodeId];

	// Add all edges from the starting node to the priority queue
	const initialEdges = network.edges[startNodeId] || [];
	for (const edge of initialEdges) {
		pq.enqueue({
			weight: edge.duration,
			fromNodeId: edge.fromId,
			toNodeId: edge.toId
		});
	}

	while (pq.size() > 0 && inMST.size < nodeIds.length) {
		// Get the edge with the minimum weight from the priority queue
		const {
			weight: currentWeight,
			fromNodeId: currentFromNodeId,
			toNodeId: currentToNodeId
		} = pq.dequeue()!;

		// If the 'toNode' is already in the MST, skip this edge
		if (inMST.has(currentToNodeId)) {
			continue;
		}

		// Add the 'toNode' to the MST
		inMST.add(currentToNodeId);
		mst.nodes[currentToNodeId] = network.nodes[currentToNodeId];

		// Add the edge that brought 'currentToNodeId' into the MST
		if (currentFromNodeId) {
			// Will be null only for the initial node's virtual edge
			const edgeToAdd: MetroNetworkEdge = {
				fromId: currentFromNodeId,
				toId: currentToNodeId,
				duration: currentWeight,
				isTransfer: false
			};
			if (!mst.edges[edgeToAdd.fromId]) {
				mst.edges[edgeToAdd.fromId] = [];
			}
			mst.edges[edgeToAdd.fromId].push(edgeToAdd);
		}

		// Add all outgoing edges from the newly added 'currentToNodeId' to the priority queue
		// only if the destination node is not yet in the MST.
		const neighbors = network.edges[currentToNodeId] || [];
		for (const edge of neighbors) {
			if (!inMST.has(edge.toId)) {
				pq.enqueue({
					weight: edge.duration,
					fromNodeId: edge.fromId,
					toNodeId: edge.toId
				});
			}
		}
	}

	// Check if all nodes were included (graph is connected).
	// Prim's algorithm works correctly on connected graphs. If the graph isn't
	// fully connected from the starting node, the MST will only cover its connected component.
	if (inMST.size < nodeIds.length) {
		console.warn(
			'The graph is not fully connected. The MST covers only the connected component reachable from the starting node.'
		);
		// Depending on requirements, you might return null or the partial MST.
		// Here, we return the partial MST found.
	}

	return mst;
}
