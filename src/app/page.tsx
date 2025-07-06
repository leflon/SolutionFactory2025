'use client';

import ItinerarySelector from '@/components/ItinerarySelector';
import Navbar from '@/components/Navbar';
import { ItineraryEndpoints, MetroNetwork } from '@/lib/types';
import { useEffect, useState } from 'react';

export default function Home() {
	const [network, setNetwork] = useState<MetroNetwork | null>(null);

	useEffect(() => {
		fetch('/api/network')
			.then((res) => res.json())
			.then(setNetwork);
	}, []);
	console.log(network);
	const handleItineraryRequest = (endpoints: ItineraryEndpoints) => {
		console.log('Request: ', endpoints);
		// TODO: Implement
	};

	return (
		<div>
			<Navbar />
			<ItinerarySelector onRequest={handleItineraryRequest} />
		</div>
	);
}
