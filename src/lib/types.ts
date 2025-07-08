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
	line: {
		id: string;
		name: string;
		color: string;
	};
	/* The direction to take on the line for this segment */
	direction: string;
	/* The time in seconds it takes to change lines from the previous segment to this segment
	 *  0 if last stop of the itinerary
	 */
	connectingDuration?: number;
}

export interface Itinerary {
	/* The segments making up the itinerary */
	segments: ItinerarySegment[];
	/* Carbon footprint of this itinerary in gCO2e */
	carbonFootprint: number;
	/* The criterion used to compute the itinerary */
	criterion: 'transfers' | 'duration';
}

export interface ItinerarySegmentWithTimings extends ItinerarySegment {
	/** The departure time of the train to ride on this segment */
	departureTime: string;
}

export interface ItineraryWithTimings extends Itinerary {
	/* The departure time of the first train */
	departureTime: string;

	segments: ItinerarySegmentWithTimings[];
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
	distance: number;
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
/**
 * When an incident is located on a specific portion of a line,
 * describes an endpoint (stop) of this portion
 */
type ImpactedEndpoint = {
	/* The IDFM id of the stop */
	id: string;
	/* The name of the stop */
	name: string;
	/** The coordinates of the stop */
	coord: {
		long: number;
		lat: number;
	};
};

/**
 * Describes an incident occuring on the metro network
 */
export type Incident = {
	/** The id of the incident */
	id: string;
	/** The periods during which the incident is active */
	applicationPeriods: Array<{
		begin: Date;
		end: Date;
	}>;
	/** The status of the incident */
	status: 'active' | 'future'; // We don't care about past incidents here.
	/** The cause of the incident */
	cause: 'disruption' | 'maintenance'; // We don't care about other causes
	/** The severity of the incident */
	severity: {
		/** A human-readable description of the severity of this incident */
		name: string;
		/** The effect of the severity on the service */
		effect: 'SIGNIFICANT_DELAYS' | 'NO_SERVICE' | 'OTHER_EFFECT';
		/** The hex color used to represent the severity of this incident */
		color: string;
	};
	/** The impacted line */
	line: {
		id: string;
		name: string;
	};
	/** The human-readable title of the incident */
	title: string;
	/** The complete message describing the incident, in HTML. */
	message: string;
	/** A short version promptly describing the incident */
	shortMessage: string;
	/** Describes which parts of the network are impacted by this incident */
	impactedObjects: Array<{
		/** A line or stop impacted by this incident */
		object: {
			/** The IDFM id of the line or stop */
			id: string;
			/** The name of the line or stop */
			name: string;
			/** Whether the object is a line or a stop */
			type: 'line' | 'stop';
			/** If the object is a stop, the line it belongs to */
			line?: {
				id: string;
				name: string;
			};
			/** If the object is a stop, the coordinates of the stop */
			coord?: {
				lat: number;
				lon: number;
			};
		};
		/** If a line is impacted, the section of the line impacted by this incident */
		impactedSection?: {
			from: ImpactedEndpoint;
			to: ImpactedEndpoint;
		};
	}>;
};
