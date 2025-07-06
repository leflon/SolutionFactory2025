export type ItineraryEndpoints = {
	/* The IDFM id of the departure stop */
	departure: string | null;
	/* The IDFM id of the destination stop */
	destination: string | null;
};

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
	/* The time in seconds it takes to change lines from the previous segment to this segment
	 *  0 if last stop of the itinerary
	 */
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

/**
 * Represents a node (stop) in the metro network
 */
export interface MetroNetworkNode {
	id: string;
	parentId: string;
	name: string;
	line: {
		id: string;
		name: string;
		color: string;
	};
	latitude: number;
	longitude: number;
}

/**
 * Interface pour une arête (liaison) dans le graphe.
 * Représente une connexion dirigée d'une station vers une autre.
 */
export interface MetroNetworkEdge {
	fromId: string;
	toId: string; // L'identifiant de la station de destination
	duration: number; // Le poids de l'arête (temps de parcours en secondes)
	isTransfer: boolean;
}

/**
 * Représente le graphe entier sous forme de liste d'adjacence.
 * La clé du dictionnaire est l'identifiant de la station de départ (StopId),
 * et la valeur est un tableau d'objets GraphEdge, représentant toutes les connexions sortantes de cette station.
 */
export type MetroNetworkAdjacencyList = {
	[fromId: string]: MetroNetworkEdge[];
};

/**
 * Structure globale pour encapsuler le graphe et les informations sur les nœuds.
 */
export interface MetroNetwork {
	nodes: {
		[stopId: string]: MetroNetworkNode;
	};
	edges: MetroNetworkAdjacencyList;
}
