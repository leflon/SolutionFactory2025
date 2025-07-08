'use client';

import ItinerarySelector from '@/components/ItinerarySelector';
import Navbar from '@/components/Navbar';
import TrafficInfo from '@/components/TrafficInfo';
import {
	Incident,
	ItineraryEndpoints,
	ItineraryWithTimings,
	MetroNetwork
} from '@/lib/types';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const InteractiveMap = dynamic(() => import('@/components/InteractiveMap'), {
	ssr: false
});
export default function Home() {
	const [network, setNetwork] = useState<MetroNetwork | undefined>(undefined);
	const [mst, setMST] = useState<MetroNetwork | undefined>(undefined);
	const [endpoints, setEndpoints] = useState<ItineraryEndpoints>({
		departure: null,
		destination: null
	});
	const [isLoadingItineraries, setIsLoadingItineraries] = useState(false);

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

	const [displayMode, setDisplayMode] = useState<'map' | 'graph' | 'mst'>(
		'map'
	);

	const [stationToZoom, setStationToZoom] = useState<string | null>(null);

	useEffect(() => {
		fetch('/api/network')
			.then((res) => res.json())
			.then(setNetwork);
		fetch('/api/network?mst')
			.then((res) => res.json())
			.then(setMST);
	}, []);

	const handleItineraryRequest = () => {
		if (!endpoints.departure || !endpoints.destination) return;
		setIsLoadingItineraries(true);
		fetch(
			`/api/itinerary?from=${endpoints.departure}&to=${endpoints.destination}&departureTime=${timing}`
		)
			.then((res) => res.json())
			.then((res) => {
				setItineraries(res);
				setIsLoadingItineraries(false);
			});
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
				displayMode={displayMode}
				setDisplayMode={setDisplayMode}
				isLoading={isLoadingItineraries}
				isConnected={
					displayMode === 'graph' ? network?.isConnected : mst?.isConnected
				}
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
				customGraph={displayMode === 'graph' ? network : mst}
				displayGraph={displayMode !== 'map'}
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
