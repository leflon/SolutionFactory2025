import { ItineraryEndpoints } from '@/lib/types';
import { useState } from 'react';
import StopSearchInput from './StopSearchInput';
import { t } from '@/lib/i18n';

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
			className='z-50 fixed top-20 bg-white flex flex-col items-center justify-center gap-2
		border border-gray-300 dark:border-gray-600 rounded-lg size-60 left-5 shadow-md dark:shadow-lg'
		>
			<div className='text-xl font-bold dark:text-white'>
				{t('ItinerarySelector.title')}
			</div>
			<StopSearchInput
				placeholder={t('ItinerarySelector.departure')}
				onSelect={(stopId) => setEndpoints({ ...endpoints, departure: stopId })}
			/>
			<StopSearchInput
				placeholder={t('ItinerarySelector.destination')}
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
				{t('ItinerarySelector.go')}
			</button>
		</div>
	);
};

export default ItinerarySelector;
