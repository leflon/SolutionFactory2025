'use client';

import InteractiveMap from '@/components/InteractiveMap';
import ItinerarySelector from '@/components/ItinerarySelector';
import Navbar from '@/components/Navbar';
import { ItineraryEndpoints, MetroNetwork } from '@/lib/types';
import { useEffect, useState } from 'react';

export default function Home() {
	const [network, setNetwork] = useState<MetroNetwork | undefined>(undefined);

	useEffect(() => {
		console.log('NETWOOOORK');
		fetch('/api/network')
			.then((res) => res.json())
			.then(setNetwork);
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
			<InteractiveMap
				minimumSpanningTree={network}
				onDepartureSelected={(id) => alert('Departure selected: ' + id)}
				onArrivalSelected={(id) => alert('Arrival selected: ' + id)}
			/>
		</>
	);
}
