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
import { distance, getTotalDistance, timeStringToSeconds } from './utils';

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
		next_longitude: number;
		next_latitude: number;
	};
	const getTimings = db.prepare(
		`
		SELECT st.stop_id AS current_stop_id,
       s.name AS current_stop_name,
       s.latitude AS current_latitude,
       s.longitude AS current_longitude,
       s.parent_station AS current_parent_station,
       st.departure_time AS current_departure_time,
       r.route_id AS current_line_id,
       r.name AS current_line_name,
       r.background_color AS current_line_color,

       COALESCE(stm1.stop_id, stp1.stop_id) AS next_stop_id,
       COALESCE(stm1.departure_time, stp1.departure_time) AS next_departure_time,
       s2.longitude AS next_longitude,
       s2.latitude AS next_latitude
  FROM StopTimes st
       JOIN
       	Stops s ON st.stop_id = s.stop_id
       JOIN
       	Routes r ON r.route_id = s.route_id
       LEFT JOIN
       	StopTimes stm1 ON st.trip_id = stm1.trip_id AND st.stop_sequence = stm1.stop_sequence - 1
       LEFT JOIN
       	StopTimes stp1 ON st.trip_id = stp1.trip_id AND st.stop_sequence = stp1.stop_sequence + 1
                           AND stm1.trip_id IS NULL
       JOIN
       	Stops s2 ON next_stop_id = s2.stop_id

 WHERE current_departure_time IS NOT NULL AND
       next_departure_time IS NOT NULL
 GROUP BY current_stop_id,
          next_stop_id
 ORDER BY st.trip_id,
          st.stop_sequence;

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
		const duration = Math.abs(
			timeStringToSeconds(timing.next_departure_time) -
				timeStringToSeconds(timing.current_departure_time)
		);
		edges[timing.current_stop_id].push({
			fromId: timing.current_stop_id,
			toId: timing.next_stop_id,
			duration,
			distance: distance(
				[timing.current_longitude, timing.current_latitude],
				[timing.next_longitude, timing.next_latitude]
			),
			isTransfer: false
		});
	}

	// Get transfers
	const transfers = db
		.prepare(
			`
		SELECT t.* FROM Transfers t
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
		time: number;
	}[];

	for (const transfer of transfers) {
		if (!edges[transfer.from_id]) {
			edges[transfer.from_id] = [];
		}
		edges[transfer.from_id].push({
			fromId: transfer.from_id,
			toId: transfer.to_id,
			duration: transfer.time,
			distance: 0,
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

let cachedMst: MetroNetwork | null = null;

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
	if (cachedMst) return cachedMst;
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
	cachedMst = mst;
	return mst;
}

/**
 * Finds the shortest path between two stops using Dijkstra's algorithm
 * @param fromStopId - The ID of the departure stop
 * @param toStopId - The ID of the destination stop
 * @returns An Itinerary object representing the shortest path, or null if no path exists
 */
export function getItineraryDijkstra(
	fromStopId: string,
	toStopId: string
): Itinerary | null {
	const network = getMetroNetwork();

	if (fromStopId === toStopId) {
		return {
			segments: [],
			carbonFootprint: 0
		};
	}

	// Dijkstra's algorithm data structures
	const distances: Map<string, number> = new Map();
	const previous: Map<string, { nodeId: string; edge: MetroNetworkEdge }> =
		new Map();
	const visited: Set<string> = new Set();

	type QueueItem = {
		nodeId: string;
		distance: number;
	};

	const pq = new PriorityQueue<QueueItem>((a, b) => a.distance - b.distance);

	// Initialize distances
	for (const nodeId of Object.keys(network.nodes)) {
		distances.set(nodeId, Infinity);
	}
	distances.set(fromStopId, 0);

	pq.enqueue({ nodeId: fromStopId, distance: 0 });

	while (pq.size() > 0) {
		const current = pq.dequeue()!;

		if (visited.has(current.nodeId)) {
			continue;
		}

		visited.add(current.nodeId);

		// Found destination
		if (current.nodeId === toStopId) {
			break;
		}

		// Check all neighbors
		const edges = network.edges[current.nodeId] || [];
		for (const edge of edges) {
			if (visited.has(edge.toId)) {
				continue;
			}

			const newDistance = current.distance + edge.duration;

			if (newDistance < distances.get(edge.toId)!) {
				distances.set(edge.toId, newDistance);
				previous.set(edge.toId, { nodeId: current.nodeId, edge });
				pq.enqueue({ nodeId: edge.toId, distance: newDistance });
			}
		}
	}

	// Check if destination is reachable
	if (!previous.has(toStopId) && fromStopId !== toStopId) {
		console.log('Destination is not reachable');
		return null;
	}

	// Reconstruct path
	const path: Array<{ nodeId: string; edge?: MetroNetworkEdge }> = [];
	let currentNodeId = toStopId;

	while (currentNodeId !== fromStopId) {
		const prev = previous.get(currentNodeId);
		if (!prev) break;

		path.unshift({ nodeId: currentNodeId, edge: prev.edge });
		currentNodeId = prev.nodeId;
	}

	// Add starting node
	path.unshift({ nodeId: fromStopId });

	if (path.length === 0) {
		return null;
	}

	// Convert path to Itinerary segments
	let segments: ItinerarySegment[] = [];
	let currentSegment: ItinerarySegment | null = null;

	for (let i = 0; i < path.length; i++) {
		const pathNode = path[i];
		const node = network.nodes[pathNode.nodeId];

		if (!node) continue;

		const isFirstStop = i === 0;

		// If this is the first stop or we're changing lines, start a new segment
		if (
			isFirstStop ||
			(currentSegment && currentSegment.line.id !== node.line.id)
		) {
			// Finish previous segment if exists
			if (currentSegment && !isFirstStop) {
				segments.push(currentSegment);
			}

			// Start new segment
			currentSegment = {
				stops: [],
				line: {
					id: node.line.id,
					name: node.line.name,
					color: node.line.color
				},
				direction: '', // We'll set this based on the next stop
				connectingDuration: isFirstStop
					? undefined
					: pathNode.edge?.isTransfer
						? pathNode.edge.duration
						: 0
			};
		}

		if (currentSegment) {
			// Add stop to current segment
			const stopDuration = pathNode.edge ? pathNode.edge.duration : 0;
			const stopDistance = pathNode.edge ? pathNode.edge.duration * 10 : 0; // Estimate distance from time

			// Avoids duplicates
			// Since two platforms within the same station are considered distinct stops,
			// We can sometimes have a path from one platform to the other, which is not relevant to the user.
			if (
				node.name ===
				currentSegment.stops[currentSegment.stops.length - 1]?.name
			)
				continue;

			currentSegment.stops.push({
				id: pathNode.nodeId,
				name: node.name,
				duration: stopDuration,
				distance: stopDistance
			});

			// Set direction for the segment if we have a next stop
			if (currentSegment.direction === '' && i < path.length - 1) {
				const nextNode = network.nodes[path[i + 1].nodeId];
				if (nextNode) {
					currentSegment.direction = nextNode.name;
				}
			}
		}
	}

	// Add the last segment
	if (currentSegment) {
		segments.push(currentSegment);
	}
	segments = segments.filter((segment) => segment.stops.length > 1);

	return {
		segments,
		// 3.8gCO2e per km (https://www.ratp.fr/aide-contact/questions/calculer-son-empreinte-carbone)
		carbonFootprint: (getTotalDistance(segments) * 3.8) / 1000
	};
}
