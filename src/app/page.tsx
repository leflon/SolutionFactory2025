'use client';

import ItineraryBreakdown from '@/components/ItineraryBreakdown';
import ItinerarySelector from '@/components/ItinerarySelector';
import Navbar from '@/components/Navbar';
import TrafficInfo from '@/components/TrafficInfo';
import InteractiveMap from '@/components/InteractiveMap';
import dynamic from 'next/dynamic';
import { t } from '@/lib/i18n';
import { PLACEHOLDER_ITINERARY } from '@/lib/Itinerary';
import { Incident, ItineraryEndpoints } from '@/lib/types';
import { useEffect, useState } from 'react';

export default function Home() {
	const [trafficInfo, setTrafficInfo] = useState<{
		incidents: Incident[];
		lastUpdate: Date;
	} | null>(null);

	const handleItineraryRequest = (endpoints: ItineraryEndpoints) => {
		console.log('Request: ', endpoints);
		// TODO: Implement API call to fetch itinerary based on endpoints
	};

	const fetchIncidents = async () => {
		const res = await fetch('/api/traffic');
		const json = await res.json();
		setTrafficInfo({
			incidents: json.incidents,
			lastUpdate: new Date(json.lastUpdate)
		});
	};
	useEffect(() => void fetchIncidents(), []); // Fetch incidents automatically only once, on component mount.

	return (
		<>
			<Navbar />
			<ItinerarySelector onRequest={handleItineraryRequest} />
			<ItineraryBreakdown itinerary={PLACEHOLDER_ITINERARY} />
			<div className='z-50 fixed bottom-5 w-full flex justify-center'>
				<div className='w-7/12 h-22 flex justify-end items-center drop-shadow-lg'>
					{trafficInfo && <TrafficInfo {...trafficInfo} />}
				</div>
			</div>
			<InteractiveMap
				onDepartureSelected={(id) => alert('Departure selected: ' + id)}
				onArrivalSelected={(id) => alert('Arrival selected: ' + id)}
			/>
		</>
	);
}
