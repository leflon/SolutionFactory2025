import { Itinerary } from '@/lib/types';
import { getTotalDuration } from '@/lib/utils';
import { MdKeyboardArrowRight } from 'react-icons/md';
import { RiLeafFill } from 'react-icons/ri';
import Image from 'next/image';
import { t } from '@/lib/i18n';
import React from 'react';

type ItineraryPreviewProps = {
	/**
	 * The itinerary to preview
	 */
	itinerary: Itinerary;
	/**
	 * Whether this itinerary should be showing a 'best carbon' label
	 */
	isBestCarbon?: boolean;
	/**
	 *Callback fired when the component is clicked.
	 */
	onClick?: () => void;
	/**
	 * Whether this itinerary is being selected
	 */
	isSelected: boolean;
};

const ItineraryPreview = ({
	itinerary,
	isBestCarbon,
	isSelected,
	onClick
}: ItineraryPreviewProps) => {
	return (
		<button
			className={
				'relative text-left dark:text-white cursor-pointer rounded bg-gray-200 dark:bg-gray-700 overflow-hidden transition-transform active:scale-95' +
				(isBestCarbon ? ' border-3 border-green-400' : '') +
				(isSelected
					? ' border-3 border-secondary'
					: ' border-3 border-gray-200')
			}
			onClick={onClick}
		>
			<div>
				{isBestCarbon && (
					<div className='relative h-5 inline-flex -translate-0.5 items-center px-2 text-xs rounded-br-sm'>
						<div className='absolute w-full h-full top-0 left-0 bg-green-400 z-0 rounded-br-sm -skew-x-10'></div>
						<RiLeafFill className='z-10' />
						<span className='z-10'>{t('ItineraryPreview.bestCarbon')}</span>
					</div>
				)}
				<div className='text-md font-bold pl-2'>
					{t(`ItineraryPreview.criterion.${itinerary.criterion}`)}
				</div>
			</div>
			<div className='flex items-center justify-between p-2'>
				<div className='flex gap-px items-center'>
					{itinerary.segments.map((segment, i) => (
						<React.Fragment key={i}>
							<Image
								src={`/metros/${segment.line.name}.png`}
								alt={segment.line.name}
								width={32}
								height={32}
							/>
							{i !== itinerary.segments.length - 1 && (
								<MdKeyboardArrowRight size={24} />
							)}
						</React.Fragment>
					))}
				</div>
				<div className='text-lg font-bold ml-4'>
					{Math.ceil(getTotalDuration(itinerary) / 60)}min
				</div>
			</div>
		</button>
	);
};

export default ItineraryPreview;
