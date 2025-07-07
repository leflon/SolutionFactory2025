'use client';

import InteractiveMap from '@/components/InteractiveMap';
import ItineraryBreakdown from '@/components/ItineraryBreakdown';
import ItinerarySelector from '@/components/ItinerarySelector';
import Navbar from '@/components/Navbar';
import { Itinerary, ItineraryEndpoints, MetroNetwork } from '@/lib/types';
import { useEffect, useState } from 'react';

export default function Home() {
	const [network, setNetwork] = useState<MetroNetwork | undefined>(undefined);
	const [itinerary, setItinerary] = useState<Itinerary | undefined>(undefined);

	useEffect(() => {
		console.log('NETWOOOORK');
		fetch('/api/network')
			.then((res) => res.json())
			.then(setNetwork);
		fetch('/api/itinerary?from=IDFM:463170&to=IDFM:463124')
			.then((res) => res.json())
			.then((res) => {
				console.log(res);
				setItinerary(res);
			});
	}, []);

	console.log(network);
	const handleItineraryRequest = (endpoints: ItineraryEndpoints) => {
		console.log('Request: ', endpoints);
		// TODO: Implement API call to fetch itinerary based on endpoints
	};

	return (
		<>
			<Navbar />
			<ItinerarySelector onRequest={handleItineraryRequest} />
			{itinerary && <ItineraryBreakdown itinerary={itinerary} />}
			<InteractiveMap
				minimumSpanningTree={network}
				onDepartureSelected={(id) => alert('Departure selected: ' + id)}
				onArrivalSelected={(id) => alert('Arrival selected: ' + id)}
			/>
		</>
	);
}
