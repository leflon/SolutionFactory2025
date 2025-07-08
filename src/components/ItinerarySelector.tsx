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

type ItinerarySelectorProps = {
	onRequest: () => any;
	endpoints: ItineraryEndpoints;
	setEndpoints: Dispatch<SetStateAction<ItineraryEndpoints>>;
	itineraries?: ItineraryWithTimings[];
	selectedItinerary: number;
	setSelectedItinerary: (i: number) => void;
	timing: string;
	setTiming: (s: string) => void;
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
	onClear,
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
		border border-gray-300 dark:border-gray-600 rounded-lg w-80 max-h-9/12 overflow-y-auto overflow-x-hidden py-4 left-5 shadow-md dark:shadow-lg'
		>
			<div className='text-xl font-bold dark:text-white'>
				{t('ItinerarySelector.title')}
			</div>
			<div className='flex items-center justify-center'>
				<div className='*:my-1 pl-4'>
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
									<option value={pad(i)}>{pad(i)}</option>
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
									<option value={pad(i)}>{pad(i)}</option>
								))}
						</select>
					</div>
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
			<button
				onClick={onRequest}
				className='cursor-pointer w-32 px-3 py-1 mt-2 border-2
				border-green-600 text-green-500 dark:border-pink-400 dark:text-pink-400
				font-medium rounded-md transition-all duration-300 ease-in-out
				hover:scale-105 hover:bg-green-600 hover:text-white hover:dark:bg-pink-400
				hover:dark:text-white'
			>
				{t('ItinerarySelector.go')}
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
