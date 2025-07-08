import {
	Itinerary,
	ItineraryEndpoints,
	ItineraryWithTimings
} from '@/lib/types';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { MdClose, MdOutlineSwapCalls } from 'react-icons/md';
import StopSearchInput from './StopSearchInput';
import { t } from '@/lib/i18n';
import ItineraryPreview from './ItineraryPreview';
import ItineraryBreakdown from './ItineraryBreakdown';
import Image from 'next/image';

type ItinerarySelectorProps = {
	onRequest: () => any;
	endpoints: ItineraryEndpoints;
	setEndpoints: Dispatch<SetStateAction<ItineraryEndpoints>>;
	itineraries?: ItineraryWithTimings[];
	selectedItinerary: number;
	setSelectedItinerary: (i: number) => void;
	timing: string;
	setTiming: (s: string) => void;
	displayMode: string;
	setDisplayMode: Dispatch<SetStateAction<'map' | 'graph' | 'mst'>>;
	isConnected?: boolean;
	onClear: () => void;
	isLoading?: boolean;
};
const ItinerarySelector = ({
	onRequest,
	endpoints,
	setEndpoints,
	itineraries,
	timing,
	setTiming,
	selectedItinerary,
	setSelectedItinerary,
	setDisplayMode,
	displayMode,
	onClear,
	isConnected,
	isLoading
}: ItinerarySelectorProps) => {
	const [displayedEndpoints, setDisplayedEndpoints] =
		useState<ItineraryEndpoints>({ departure: null, destination: null });

	const timingSplit = timing.split(':');

	const onTimingSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const type = e.target.dataset.type!;
		let str = '';
		if (type === 'hours') {
			str = `${e.target.value}:${timingSplit[1]}:00`;
		} else {
			str = `${timingSplit[0]}:${e.target.value}:00`;
		}
		setTiming(str);
	};

	const fetchName = async (
		endpoint: 'departure' | 'destination',
		id: string
	) => {
		const { stop } = await fetch(`/api/stop/${id}`).then((res) => res.json());
		if (!stop) return;

		const { name } = stop;
		setDisplayedEndpoints((endpoints) => ({ ...endpoints, [endpoint]: name }));
	};

	useEffect(() => {
		if (endpoints.departure) fetchName('departure', endpoints.departure);
	}, [endpoints.departure]);
	useEffect(() => {
		if (endpoints.destination) fetchName('destination', endpoints.destination);
	}, [endpoints.destination]);

	const clear = () => {
		setDisplayedEndpoints({ departure: '', destination: '' });
		onClear();
	};

	const pad = (i: number) => `${i < 9 ? '0' : ''}${i}`;

	return (
		<div
			className='z-50 fixed top-20 bg-white flex flex-col items-center gap-2
		border border-gray-300 dark:border-gray-600 dark:bg-gray-800 *:dark:text-white rounded-lg w-80 max-h-9/12 overflow-y-auto overflow-x-hidden py-4 left-5 shadow-md dark:shadow-lg'
		>
			<div className='flex items-center gap-2 mb-2'>
				<Image
					src={`/logos/Logo.png`}
					width={60}
					height={60}
					alt={'Logo du site'}
				/>
				<div>
					<p className='font-bold dark:text-white'>Roule</p>
					<p className='font-bold dark:text-white'>Ma Poule</p>
				</div>
			</div>
			<div className='text-xl font-bold dark:text-white'>
				{t('ItinerarySelector.title')}
			</div>
			<div className='flex flex-col pl-4'>
				<div className='flex items-center justify-center'>
					<div className='*:my-1'>
						<StopSearchInput
							placeholder={t('ItinerarySelector.departure')}
							onSelect={(stopId) =>
								setEndpoints({ ...endpoints, departure: stopId })
							}
							value={displayedEndpoints.departure}
						/>
						<StopSearchInput
							placeholder={t('ItinerarySelector.destination')}
							onSelect={(stopId) =>
								setEndpoints({ ...endpoints, destination: stopId })
							}
							value={displayedEndpoints.destination}
						/>
					</div>
					<div>
						{itineraries && (
							<MdClose
								size={38}
								className='shrink-0 mx-2 cursor-pointer will-change-transform transition-all hover:bg-gray-400/20 active:scale-90 p-2 rounded-full'
								onClick={clear}
							/>
						)}
						<MdOutlineSwapCalls
							size={38}
							className='shrink-0 mx-2 cursor-pointer will-change-transform transition-all hover:bg-gray-400/20 active:scale-90 p-2 rounded-full'
							onClick={() => {
								setEndpoints({
									departure: endpoints.destination,
									destination: endpoints.departure
								});
								setDisplayedEndpoints({
									departure: displayedEndpoints.destination,
									destination: displayedEndpoints.departure
								});
							}}
						/>
					</div>
				</div>
				<div className='*:mx-1'>
					<span>{t('ItinerarySelector.displayMode.label')}</span>
					<select
						onChange={(e) =>
							setDisplayMode(e.target.value as 'map' | 'graph' | 'mst')
						}
						value={displayMode}
					>
						<option value='map'>
							{t('ItinerarySelector.displayMode.map')}
						</option>
						<option value='graph'>
							{t('ItinerarySelector.displayMode.graph')}
						</option>
						<option value='mst'>
							{t('ItinerarySelector.displayMode.mst')}
						</option>
					</select>
				</div>
				<div hidden={displayMode === 'map'} className='*:mx-1'>
					<span>{t('ItinerarySelector.isConnected.label')}</span>
					<span>
						{t(`ItinerarySelector.isConnected.${isConnected ? 'yes' : 'no'}`)}
					</span>
				</div>
				<div className='*:mx-1'>
					<span>{t('ItinerarySelector.timing.from')}</span>
					<select
						value={timingSplit[0]}
						onChange={onTimingSelect}
						data-type='hours'
					>
						{Array(24)
							.fill(0)
							.map((_, i) => (
								<option value={pad(i)} key={i}>
									{pad(i)}
								</option>
							))}
					</select>
					<span>:</span>
					<select
						value={timingSplit[1]}
						onChange={onTimingSelect}
						data-type='minutes'
					>
						{Array(60)
							.fill(0)
							.map((_, i) => (
								<option value={pad(i)} key={i}>
									{pad(i)}
								</option>
							))}
					</select>
				</div>
			</div>

			<button
				onClick={onRequest}
				className='cursor-pointer w-32 px-3 py-1 mt-2 border-2
				border-green-600  dark:border-pink-400
				font-medium rounded-md transition-all duration-300 ease-in-out
				hover:scale-105 bg-green-600 text-white dark:bg-pink-400
				hover:dark:text-white flex items-center justify-center'
			>
				{!isLoading ? (
					<span>{t('ItinerarySelector.go')}</span>
				) : (
					<div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
				)}
			</button>
			<div className='flex flex-col gap-2 w-full px-4'>
				{itineraries &&
					itineraries.map((itinerary, i) => (
						<ItineraryPreview
							key={i}
							itinerary={itinerary}
							isBestCarbon={i === 0}
							isSelected={i === selectedItinerary}
							onClick={() => setSelectedItinerary(i)}
						/>
					))}
			</div>
			{itineraries && selectedItinerary !== -1 && (
				<ItineraryBreakdown itinerary={itineraries[selectedItinerary]} />
			)}
		</div>
	);
};

export default ItinerarySelector;
