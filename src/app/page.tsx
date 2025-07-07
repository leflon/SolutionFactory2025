'use client';

import InteractiveMap from '@/components/InteractiveMap';
import ItineraryBreakdown from '@/components/ItineraryBreakdown';
import ItinerarySelector from '@/components/ItinerarySelector';
import Navbar from '@/components/Navbar';
import { Itinerary, ItineraryEndpoints, MetroNetwork } from '@/lib/types';
import { useEffect, useState } from 'react';

export default function Home() {
	const [network, setNetwork] = useState<MetroNetwork | undefined>(undefined);
	const [endpoints, setEndpoints] = useState<ItineraryEndpoints>({
		departure: null,
		destination: null
	});
	const [itineraries, setItineraries] = useState<Itinerary[] | undefined>(
		undefined
	);
	const [selectedItinerary, setSelectedItinerary] = useState(-1);

	useEffect(() => {
		fetch('/api/network')
			.then((res) => res.json())
			.then(setNetwork);
	}, []);

	const handleItineraryRequest = () => {
		console.log('ok?');
		// TODO: Implement API call to fetch itinerary based on endpoints
		if (!endpoints.departure || !endpoints.destination) return;
		fetch(
			`/api/itinerary?from=${endpoints.departure}&to=${endpoints.destination}`
		)
			.then((res) => res.json())
			.then(setItineraries);
		setSelectedItinerary(-1);
	};

	console.log(itineraries);

	return (
		<>
			<Navbar />
			<ItinerarySelector
				onRequest={handleItineraryRequest}
				endpoints={endpoints}
				setEndpoints={setEndpoints}
				itineraries={itineraries}
				onClear={() => {
					setItineraries(undefined);
					setEndpoints({ departure: null, destination: null });
					setSelectedItinerary(-1);
				}}
				onSelectItinerary={(selected) =>
					setSelectedItinerary(
						itineraries ? itineraries.findIndex((it) => it === selected) : -1
					)
				}
			/>
			{itineraries && selectedItinerary !== -1 && (
				<ItineraryBreakdown itinerary={itineraries[selectedItinerary]} />
			)}
			<InteractiveMap
				itinerary={
					selectedItinerary !== -1 && itineraries
						? itineraries[selectedItinerary]
						: undefined
				}
				onDepartureSelected={(id) =>
					setEndpoints((endpoints) => ({ ...endpoints, departure: id }))
				}
				onDestinationSelected={(id) =>
					setEndpoints((endpoints) => ({ ...endpoints, destination: id }))
				}
			/>
		</>
	);
}
