'use client';

import InteractiveMap from '@/components/InteractiveMap';
import ItineraryBreakdown from '@/components/ItineraryBreakdown';
import ItinerarySelector from '@/components/ItinerarySelector';
import Navbar from '@/components/Navbar';
import TrafficInfo from '@/components/TrafficInfo';
import {
	Itinerary,
	Incident,
	ItineraryEndpoints,
	MetroNetwork,
	ItineraryWithTimings
} from '@/lib/types';
import { useEffect, useState } from 'react';

export default function Home() {
	const [network, setNetwork] = useState<MetroNetwork | undefined>(undefined);
	const [endpoints, setEndpoints] = useState<ItineraryEndpoints>({
		departure: null,
		destination: null
	});
	const now = new Date();
	now.setSeconds(0);
	const [timing, setTiming] = useState(
		now.toLocaleTimeString('en-US', { hour12: false })
	);
	const [itineraries, setItineraries] = useState<
		ItineraryWithTimings[] | undefined
	>(undefined);
	const [selectedItinerary, setSelectedItinerary] = useState(-1);

	const [trafficInfo, setTrafficInfo] = useState<{
		incidents: Incident[];
		lastUpdate: Date;
	} | null>(null);

	const [stationToZoom, setStationToZoom] = useState<string | null>(null);

	useEffect(() => {
		fetch('/api/network')
			.then((res) => res.json())
			.then(setNetwork);
	}, []);

	const handleItineraryRequest = () => {
		if (!endpoints.departure || !endpoints.destination) return;
		fetch(
			`/api/itinerary?from=${endpoints.departure}&to=${endpoints.destination}&departureTime=${timing}`
		)
			.then((res) => res.json())
			.then(setItineraries);
		setSelectedItinerary(-1);
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
			<ItinerarySelector
				onRequest={handleItineraryRequest}
				endpoints={endpoints}
				setEndpoints={setEndpoints}
				itineraries={itineraries}
				timing={timing}
				setTiming={setTiming}
				onClear={() => {
					setItineraries(undefined);
					setEndpoints({ departure: null, destination: null });
					setSelectedItinerary(-1);
				}}
				selectedItinerary={selectedItinerary}
				setSelectedItinerary={setSelectedItinerary}
			/>
			{trafficInfo && (
				<div className='z-50 fixed bottom-5 w-full'>
					<div className='w-1/2 mx-auto'>
						<TrafficInfo
							incidents={trafficInfo.incidents}
							lastUpdate={trafficInfo.lastUpdate}
						/>
					</div>
				</div>
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
