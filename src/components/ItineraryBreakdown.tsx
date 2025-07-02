'use client';
import {
	getSegmentDurationInMinutes,
	getTotalDistance,
	getTotalDuration,
	getTotalStops,
	getTotalWalkingDuration,
	Itinerary,
	ItinerarySegment,
} from '@/lib/Itinerary';
import {
	MdDirectionsWalk,
	MdKeyboardArrowDown,
	MdKeyboardArrowRight,
	MdSchedule,
	MdLocationPin,
} from 'react-icons/md';
import Image from 'next/image';
import { Fragment, useState } from 'react';
import MetroLineInfo from '@/components/LineInformation';
import { t } from '@/lib/i18n';
type ItineraryBreakdownPartProps = {
	segment: ItinerarySegment;
};

// Allows us to inject CSS variables directly from the component template, to style the small stop indicators border color.
declare module 'react' {
	interface CSSProperties {
		'--border-color'?: string;
	}
}
const ItineraryBreakdownPart = ({ segment }: ItineraryBreakdownPartProps) => {
	const duration = getSegmentDurationInMinutes(segment);
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className='relative pl-4'>
			<div
				className='line-indicator'
				style={{ backgroundColor: segment.lineColor }}
			></div>
			<div className='font-bold leading-none has-stop-indicator'>
				{segment.stops[0].name}
			</div>
			<div className='py-2 flex flex-row gap-2 items-center'>
				<Image
					src={`/metros/${segment.line}.png`}
					alt={segment.line}
					width={18}
					height={18}
					className='shrink-0 grow-0 w-max-content'
				/>
				<span
					dangerouslySetInnerHTML={{
						__html: t('ItineraryBreakdown.direction', {
							direction: segment.direction,
						}),
					}}
				></span>
				<MetroLineInfo
				lineName={`${segment.line}`}
				/>
			</div>
			<div
				className='flex flex-row items-center cursor-pointer'
				onClick={() => setIsOpen(!isOpen)}
			>
				<MdKeyboardArrowDown
					size={18}
					className={
						(isOpen ? 'rotate-180' : '') + ' transition-transform duration-300'
					}
				/>
				{t('ItineraryBreakdown.duration', { duration })} (
				{t('ItineraryBreakdown.stops', { count: segment.stops.length })})
			</div>
			{/* overflow transitions are too complex for plain tailwind, so we use a custom class */}
			<div className={'middle-stops-container' + (isOpen ? ' open' : '')}>
				{segment.stops.slice(1, -1).map((stop) => (
					<div
						className='my-2 pl-3 text-xs text-gray-600 dark:text-gray-300 has-stop-indicator small-indicator'
						style={{ '--border-color': segment.lineColor }}
						data-displayed={isOpen}
						key={stop.id}
					>
						{stop.name}
					</div>
				))}
			</div>
			<div className='font-bold leading-none has-stop-indicator mt-4'>
				{segment.stops[segment.stops.length - 1].name}
			</div>
		</div>
	);
};

type ItineraryBreakdownProps = {
	itinerary: Itinerary;
};
const ItineraryBreakdown = ({ itinerary }: ItineraryBreakdownProps) => {
	return (
		<div className='fixed bottom-10 left-5 h-1/2 w-60 bg-white dark:bg-gray-700 shadow-lg rounded-lg p-4 overflow-y-auto z-50 dark:text-white border-[1px] border-gray-300 dark:border-gray-600'>
			<div
				className={
					'flex flex-row *:shrink-0 items-center gap-1 mb-2 bg-gray-100 dark:bg-gray-600 p-2 rounded-lg' +
					(itinerary.segments.length > 2
						? ' overflow-x-auto justify-start'
						: ' justify-center')
				}
			>
				{itinerary.segments.map((segment, i) => (
					<Fragment key={segment.line}>
						{segment.connectingDuration && (
							<>
								<div className='text-xs flex flex-row items-center'>
									<MdDirectionsWalk size={18} />
									{itinerary.segments.length < 3
										? `${t('ItineraryBreakdown.duration', { duration: Math.ceil(segment.connectingDuration / 60) })}`
										: ''}
								</div>
								<MdKeyboardArrowRight size={18} />
							</>
						)}
						<Image
							src={`/metros/${segment.line}.png`}
							alt={segment.line}
							width={18}
							height={18}
						/>
						{i !== itinerary.segments.length - 1 && (
							<MdKeyboardArrowRight size={18} />
						)}
					</Fragment>
				))}
			</div>
			<div className='flex flex-row gap-2 mb-4 justify-center *:flex *:flex-row *:items-center *:text-xs *:gap-1'>
				<div>
					<MdSchedule size={18} />
					{t('ItineraryBreakdown.duration', {
						duration: Math.ceil(getTotalDuration(itinerary) / 60),
					})}
				</div>
				<div>
					<MdDirectionsWalk size={18} />
					{t('ItineraryBreakdown.duration', {
						duration: Math.ceil(getTotalWalkingDuration(itinerary) / 60),
					})}
				</div>
				<div>
					<MdLocationPin size={18} />
					{t('ItineraryBreakdown.stops', { count: getTotalStops(itinerary) })}
				</div>
			</div>
			{itinerary.segments.map((segment, i) => (
				<div key={segment.line}>
					{i !== 0 && (
						<div className='h-12 border-l-6 border-dotted border-blue-500 my-1 pl-2 flex flex-row items-center gap-1'>
							<MdDirectionsWalk size={18} />
							<span>
								{segment.connectingDuration &&
									Math.ceil(segment.connectingDuration / 60)}{' '}
								min
							</span>
						</div>
					)}
					<ItineraryBreakdownPart segment={segment} />
				</div>
			))}
		</div>
	);
};

export default ItineraryBreakdown;
