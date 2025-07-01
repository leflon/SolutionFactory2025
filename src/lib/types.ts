export type ItineraryEndpoints = {
	/* The IDFM id of the departure stop */
	departure: string | null;
	/* The IDFM id of the destination stop */
	destination: string | null;
};

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
