import { Itinerary } from '@/lib/types';
import { getTotalDuration } from '@/lib/utils';
import { MdKeyboardArrowRight } from 'react-icons/md';
import { RiLeafFill } from 'react-icons/ri';
import Image from 'next/image';
import { t } from '@/lib/i18n';

type ItineraryPreviewProps = {
	itinerary: Itinerary;
	isBestCarbon?: boolean;
	onClick?: () => void;
};

const ItineraryPreview = ({
	itinerary,
	isBestCarbon,
	onClick
}: ItineraryPreviewProps) => {
	return (
		<button
			className={
				'relative text-left cursor-pointer rounded bg-gray-200 overflow-hidden' +
				(isBestCarbon ? ' border-3 border-green-400' : '')
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
						<>
							<Image
								src={`/metros/${segment.line.name}.png`}
								alt={segment.line.name}
								width={32}
								height={32}
							/>
							{i !== itinerary.segments.length - 1 && (
								<MdKeyboardArrowRight size={24} />
							)}
						</>
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
