import { ItineraryEndpoints } from '@/lib/types';
import { useState } from 'react';
import StopSearchInput from './StopSearchInput';

type ItinerarySelectorProps = {
	onRequest: (endpoints: ItineraryEndpoints) => any;
};
const ItinerarySelector = ({ onRequest }: ItinerarySelectorProps) => {
	const [endpoints, setEndpoints] = useState<ItineraryEndpoints>({
		departure: null,
		destination: null,
	});

	return (
		<div
			className='absolute flex flex-col items-center justify-center gap-2
		border border-gray-300 dark:border-gray-600 rounded-sm size-60 left-5 shadow-md dark:shadow-lg'
		>
			<div className='text-xl font-bold dark:text-white'>Votre itinéraire</div>
			<StopSearchInput
				placeholder='Point de départ'
				onSelect={(stopId) => setEndpoints({ ...endpoints, departure: stopId })}
			/>
			<StopSearchInput
				placeholder='Destination'
				onSelect={(stopId) =>
					setEndpoints({ ...endpoints, destination: stopId })
				}
			/>
			<button
				onClick={() => onRequest(endpoints)}
				className='cursor-pointer w-32 px-3 py-1 mt-2 border-2
				border-green-600 text-green-500 dark:border-pink-400 dark:text-pink-400
				font-medium rounded-md transition-all duration-300 ease-in-out
				hover:scale-105 hover:bg-green-600 hover:text-white hover:dark:bg-pink-400
				hover:dark:text-white'
			>
				Aller
			</button>
		</div>
	);
};

export default ItinerarySelector;
