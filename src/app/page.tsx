'use client';

import ItineraryBreakdown from '@/components/ItineraryBreakdown';
import ItinerarySelector from '@/components/ItinerarySelector';
import Navbar from '@/components/Navbar';
import InteractiveMap from '@/components/InteractiveMap';
import dynamic from 'next/dynamic';
import { t } from '@/lib/i18n';
import { PLACEHOLDER_ITINERARY } from '@/lib/Itinerary';
import { ItineraryEndpoints } from '@/lib/types';
import { useState } from 'react';

export default function Home() {
	const handleItineraryRequest = (endpoints: ItineraryEndpoints) => {
		console.log('Request: ', endpoints);
		// TODO: Implement API call to fetch itinerary based on endpoints
	};

	return (
		<>
			<Navbar />
			<ItinerarySelector onRequest={handleItineraryRequest} />
			<ItineraryBreakdown itinerary={PLACEHOLDER_ITINERARY} />
			<InteractiveMap
				onDepartureSelected={(id) => alert('Departure selected: ' + id)}
				onArrivalSelected={(id) => alert('Arrival selected: ' + id)}
			/>
		</>
	);
}
