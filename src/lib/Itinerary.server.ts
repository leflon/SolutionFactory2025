import { PriorityQueue } from '@datastructures-js/priority-queue';
import db from './db';
import {
	Itinerary,
	ItinerarySegment,
	ItineraryWithTimings,
	MetroNetwork,
	MetroNetworkAdjacencyList,
	MetroNetworkEdge,
	MetroNetworkNode
} from './types';
import {
	dateToTimeString,
	distance,
	getTotalDistance,
	isConnected,
	timeStringToDate,
	timeStringToSeconds
} from './utils';

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
		SELECT
  st.stop_id AS current_stop_id,
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
JOIN Stops s ON st.stop_id = s.stop_id

-- 🛠️ Corrigé ici : passage via Trips
JOIN Trips t ON st.trip_id = t.trip_id
JOIN Routes r ON t.route_id = r.route_id

-- Stop suivant (si disponible)
LEFT JOIN StopTimes stm1
  ON st.trip_id = stm1.trip_id AND st.stop_sequence = stm1.stop_sequence - 1

-- Alternative si pas de stop suivant
LEFT JOIN StopTimes stp1
  ON st.trip_id = stp1.trip_id AND st.stop_sequence = stp1.stop_sequence + 1
     AND stm1.trip_id IS NULL

-- Détails du prochain arrêt
LEFT JOIN Stops s2 ON s2.stop_id = COALESCE(stm1.stop_id, stp1.stop_id)

WHERE
  st.departure_time IS NOT NULL AND
  COALESCE(stm1.departure_time, stp1.departure_time) IS NOT NULL

GROUP BY current_stop_id, next_stop_id
ORDER BY st.trip_id, st.stop_sequence;

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
		// This specific stop point for Porte d'Auteuil allows a direct trip to Michel-Ange - Molitor
		// Which does not happen in commercial exploitation. To avoid giving wrong data to users,
		// We do not allow any edges from this stop point
		if (timing.current_stop_id === 'IDFM:463234') {
			continue;
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
	metroNetwork.isConnected = isConnected(metroNetwork);
	return metroNetwork;
}

interface PrimQueueEntry {
	weight: number;
	fromNodeId: string | null; // The node from which this edge originates (for building the MST)
	toNodeId: string; // The node to which this edge leads
	distance: number;
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
			toNodeId: edge.toId,
			distance: edge.distance
		});
	}

	while (pq.size() > 0 && inMST.size < nodeIds.length) {
		// Get the edge with the minimum weight from the priority queue
		const {
			weight: currentWeight,
			fromNodeId: currentFromNodeId,
			toNodeId: currentToNodeId,
			distance: currentDistance
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
				distance: currentDistance,
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
					toNodeId: edge.toId,
					distance: edge.distance
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
	mst.isConnected = isConnected(mst);
	cachedMst = mst;
	return mst;
}

/**
 * Finds the shortest path between two stops using Dijkstra's algorithm
 * @param fromStopId - The ID of the departure stop
 * @param toStopId - The ID of the destination stop
 * @param criterion - The criterion used to optimize the path. Transfers will minimize the number of transfers by making the weight a transfer ridiculously high
 * @returns An Itinerary object representing the shortest path, or null if no path exists
 */
export function getItineraryDijkstra(
	fromStopId: string,
	toStopId: string,
	criterion: 'duration' | 'transfers' = 'duration'
): Itinerary | null {
	const network = getMetroNetwork();

	if (fromStopId === toStopId) {
		return {
			segments: [],
			carbonFootprint: 0,
			criterion
		};
	}

	const fromParent = network.nodes[fromStopId].parentId;

	// Dijkstra's algorithm data structures
	// `distances` stores the shortest distance from the start node to every other node.
	const distances: Map<string, number> = new Map();
	// `previous` stores the preceding node in the shortest path, used for reconstructing the path.
	const previous: Map<string, { nodeId: string; edge: MetroNetworkEdge }> =
		new Map();
	// `visited` keeps track of nodes for which we have found the shortest path.
	const visited: Set<string> = new Set();

	type QueueItem = {
		nodeId: string;
		distance: number;
	};

	// A priority queue to efficiently retrieve the node with the smallest distance.
	const pq = new PriorityQueue<QueueItem>((a, b) => a.distance - b.distance);

	// Initialize distances: all nodes are infinitely far initially, except for the start node.
	for (const nodeId of Object.keys(network.nodes)) {
		distances.set(nodeId, Infinity);
	}
	// The distance to the starting node is 0.
	distances.set(fromStopId, 0);

	// Add the starting node to the priority queue.
	pq.enqueue({ nodeId: fromStopId, distance: 0 });

	// Main loop of Dijkstra's algorithm.
	while (pq.size() > 0) {
		// Get the node with the smallest distance from the priority queue.
		const current = pq.dequeue()!;

		// If we've already found the shortest path for this node, skip it.
		if (visited.has(current.nodeId)) {
			continue;
		}

		// Mark the current node as visited.
		visited.add(current.nodeId);

		// If we've reached the destination, we can stop early.
		if (current.nodeId === toStopId) {
			break;
		}

		// Explore all neighbors of the current node.
		const edges = network.edges[current.nodeId] || [];
		for (const edge of edges) {
			// Skip neighbors for which we've already found the shortest path.
			if (visited.has(edge.toId)) {
				continue;
			}
			let newDistance;
			if (edge.isTransfer && network.nodes[edge.toId].parentId === fromParent) {
				// Avoid considering transfers in the departure station, these are just quircks from our data structure.
				newDistance = 0;
			} else {
				// Calculate the new distance to the neighbor through the current node.
				newDistance = current.distance + edge.duration;
				// If the optimization criterion is 'transfers', add a heavy penalty for transfers
				// to prioritize routes with fewer changes.
				if (criterion === 'transfers' && edge.isTransfer) {
					newDistance += 1000;
				} else if (edge.isTransfer) {
					// For duration-based searches, add a tiny penalty for transfers.
					// This acts as a tie-breaker, favoring paths with fewer transfers
					// when durations are otherwise equal.
					newDistance += 0.001;
				}
			}

			// If we found a shorter path to the neighbor, update its distance and predecessor.
			if (newDistance < distances.get(edge.toId)!) {
				distances.set(edge.toId, newDistance);
				previous.set(edge.toId, { nodeId: current.nodeId, edge });
				// Add the neighbor to the priority queue with its new, shorter distance.
				pq.enqueue({ nodeId: edge.toId, distance: newDistance });
			}
		}
	}

	// After the loop, if the destination has no predecessor, it means it's not reachable from the start.
	if (!previous.has(toStopId) && fromStopId !== toStopId) {
		console.log('Destination is not reachable');
		return null;
	}

	// Reconstruct the shortest path by backtracking from the destination to the start.
	const path: Array<{ nodeId: string; edge?: MetroNetworkEdge }> = [];
	let currentNodeId = toStopId;

	// Follow the `previous` map to trace the path backwards.
	while (currentNodeId !== fromStopId) {
		const prev = previous.get(currentNodeId);
		if (!prev) break; // Should not happen if a path exists.

		// Add the current node and the edge that led to it to the front of the path array.
		path.unshift({ nodeId: currentNodeId, edge: prev.edge });
		currentNodeId = prev.nodeId;
	}

	// Add the starting node to complete the path.
	path.unshift({ nodeId: fromStopId });

	if (path.length === 0) {
		return null;
	}
	// Convert the reconstructed path of nodes and edges into user-friendly itinerary segments.
	let segments: ItinerarySegment[] = [];
	let currentSegment: ItinerarySegment | null = null;

	for (let i = 0; i < path.length; i++) {
		const pathNode = path[i];
		const node = network.nodes[pathNode.nodeId];

		if (!node) continue;

		const isFirstStop = i === 0;

		// If this is the first stop or we're changing lines, start a new segment
		if (isFirstStop || (currentSegment && pathNode.edge?.isTransfer)) {
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

			currentSegment.stops.push({
				id: pathNode.nodeId,
				name: node.name,
				duration: stopDuration,
				distance: stopDistance
			});
			currentSegment.direction = ''; // To be filled when timings are added
		}
	}

	// Add the last segment
	if (currentSegment) {
		segments.push(currentSegment);
	}

	// This gets rid of implicit transfers (platform->platform from the same line on the same stop)
	// For i === 0, we remove the first ones, since the last one is the one actually connected to the itinerary
	// For i === segment.stops.length - 1, we remove the last ones, since the first one is the one actually connected to the itinerary
	segments.forEach((segment) => {
		let i = 0;
		while (i < segment.stops.length) {
			if (segment.stops.length < 2) break;
			if (i === 0 && segment.stops[i + 1].name === segment.stops[i].name) {
				segment.stops.splice(i, 1);
			} else if (
				i === segment.stops.length - 1 &&
				segment.stops[i - 1].name === segment.stops[i].name
			) {
				segment.stops.splice(i, 1);
			} else {
				i++;
			}
		}
	});

	segments = segments.filter((segment) => segment.stops.length > 1);
	segments[0].connectingDuration = undefined;

	const getPosition = db.prepare(`
		SELECT tp.* FROM TransferPositions tp
JOIN Stops s1 ON tp.from_id = s1.stop_id
JOIN Stops s2 ON tp.to_id = s2.stop_id
WHERE from_id = ?
AND (to_id = ? OR s2.route_id = ?);
		`);
	segments.forEach((segment, i) => {
		if (i === segments.length - 1) return;
		const next = segments[i + 1].stops[0].id;
		const position = getPosition.get(
			segment.stops[segment.stops.length - 1].id,
			next,
			segment.line.id
		);
		segment.positionInTrain = (<any>position)?.position as
			| 'front'
			| 'mid'
			| 'rear';
	});

	return {
		segments,
		// 3.8gCO2e per km (https://www.ratp.fr/aide-contact/questions/calculer-son-empreinte-carbone)
		carbonFootprint: (getTotalDistance(segments) * 3.8) / 1000,
		criterion
	};
}

export function getItineraryWithDepartureTime(
	departure: string,
	fromId: string,
	toId: string,
	criterion: 'duration' | 'transfers' = 'duration'
): ItineraryWithTimings {
	const itinerary = getItineraryDijkstra(fromId, toId, criterion);
	const network = getMetroNetwork();
	const returned = itinerary as ItineraryWithTimings; // Filling in missing properties below

	let currentDepartureTime = departure;

	const getNextTrain = db.prepare(`
		SELECT st.departure_time,
			st2.departure_time as arrival_time,
			st3.stop_id as direction_id, -- ID of the direction to ride
			MAX(st3.stop_sequence) -- makes sure st3 is the last station of the line, giving us the direction
		FROM StopTimes st
		JOIN StopTimes st2 ON st2.trip_id = st.trip_id
		JOIN StopTimes st3 ON st3.trip_id = st.trip_id
		WHERE
			st.stop_id = ? -- The stop we're starting from
			AND st2.stop_id = ? -- Make sure this train will go to the desired station
			AND st.departure_time > ? -- Restricts to the trains the user can ride (after request departure time)
		GROUP BY st.trip_id
		ORDER BY st.departure_time -- Soonest train first
		LIMIT 1 -- We only need the next train;
		`);
	// If the user is requesting to ride at an impossible time (during the night),
	// We just get them the first train of the day as a fallback
	const fallback = db.prepare(`
		SELECT st.departure_time,
			st2.departure_time as arrival_time,
			st3.stop_id as direction_id, -- ID of the direction to ride
			MAX(st3.stop_sequence) -- makes sure st3 is the last station of the line, giving us the direction
		FROM StopTimes st
		JOIN StopTimes st2 ON st2.trip_id = st.trip_id
		JOIN StopTimes st3 ON st3.trip_id = st.trip_id
		WHERE
			st.stop_id = ? -- The stop we're starting from
			AND st2.stop_id = ? -- Make sure this train will go to the desired station
		GROUP BY st.trip_id
		ORDER BY st.departure_time -- Soonest train first
		LIMIT 1 -- We only need the next train;
		`);

	type Row = {
		departure_time: string;
		arrival_time: string;
		direction_id: string;
		// Ignoring MAX(...), it's only there for sorting purposes
	};
	returned.segments.forEach((segment, i) => {
		// Take transfer time and previous segment duration into account before checking next trains
		if (i > 0) {
			const time = timeStringToDate(currentDepartureTime);
			const prev = returned.segments[i - 1];
			// Using Math.ceil systematically to always be safe with transfer times
			time.setMinutes(
				time.getMinutes() +
					Math.ceil((segment.connectingDuration ?? 0) / 60) +
					Math.ceil(
						prev.stops.reduce((acc, stop) => acc + stop.duration, 0) / 60
					)
			);
			currentDepartureTime = dateToTimeString(time);
		}
		console.log(currentDepartureTime);

		let row = getNextTrain.get(
			segment.stops[0].id,
			segment.stops[segment.stops.length - 1].id,
			currentDepartureTime
		) as Row;
		if (!row) {
			row = fallback.get(
				segment.stops[0].id,
				segment.stops[segment.stops.length - 1].id
			) as Row;
		}

		segment.departureTime = row.departure_time;
		if (i === 0) returned.departureTime = row.departure_time;

		// Set direction
		segment.direction = network.nodes[row.direction_id]?.name || '';
	});

	return returned;
}
