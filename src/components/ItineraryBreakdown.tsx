'use client';
import MetroLineInfo from '@/components/LineInformation';
import { t } from '@/lib/i18n';
import {
	Itinerary,
	ItinerarySegment,
	ItinerarySegmentWithTimings,
	ItineraryWithTimings
} from '@/lib/types';
import {
	getSegmentDurationInMinutes,
	getTotalDuration,
	getTotalStops,
	getTotalWalkingDuration,
	timeStringToDate
} from '@/lib/utils';
import Image from 'next/image';
import { Fragment, useState } from 'react';
import {
	MdDirectionsWalk,
	MdKeyboardArrowDown,
	MdKeyboardArrowRight,
	MdLocationPin,
	MdSchedule
} from 'react-icons/md';
import { RiLeafFill } from 'react-icons/ri';
type ItineraryBreakdownPartProps = {
	segment: ItinerarySegmentWithTimings;
	onStationClick?: (stationName: string) => void;
};

// Allows us to inject CSS variables directly from the component template, to style the small stop indicators border color.
declare module 'react' {
	interface CSSProperties {
		'--border-color'?: string;
		'--data-index'?: number;
	}
}
const ItineraryBreakdownPart = ({
	segment,
	onStationClick
}: ItineraryBreakdownPartProps) => {
	const duration = getSegmentDurationInMinutes(segment);
	const [isOpen, setIsOpen] = useState(false);
	return (
		<div className='relative pl-4 dark:text-white'>
			<div
				className='line-indicator'
				style={{ backgroundColor: '#' + segment.line.color }}
			></div>
			<div
				className='font-bold leading-none has-stop-indicator'
				title={segment.stops[0].name}
			>
				<span className='block whitespace-nowrap overflow-ellipsis w-full overflow-hidden'>
					{segment.stops[0].name}
				</span>
			</div>
			<div className='pt-2 pl-1'>
				{t('ItineraryBreakdown.timing.from')}
				{timeStringToDate(segment.departureTime).toLocaleTimeString('fr-FR', {
					hour: '2-digit',
					minute: '2-digit'
				})}
			</div>
			<div className='py-2 flex flex-row gap-2 items-center'>
				<Image
					src={`/metros/${segment.line.name}.png`}
					alt={segment.line.name}
					width={18}
					height={18}
					className='shrink-0 grow-0 w-max-content'
				/>
				<span
					dangerouslySetInnerHTML={{
						__html: t('ItineraryBreakdown.direction', {
							direction: segment.direction
						})
					}}
				></span>
				<MetroLineInfo
					lineName={`${segment.line.name}`}
					onStationClick={onStationClick}
				/>
			</div>
			<div
				className='flex flex-row items-center cursor-pointer'
				onClick={() => setIsOpen(!isOpen)}
			>
				<MdKeyboardArrowDown
					size={18}
					className={
						(isOpen ? 'rotate-180' : '') +
						' transition-transform duration-300' +
						(segment.stops.length < 3
							? ' opacity-0' /* Hides the arrow since there is nothing to show, but keeps alignment. */
							: '')
					}
				/>
				{t('ItineraryBreakdown.duration', { duration })} (
				{t('ItineraryBreakdown.stops', { count: segment.stops.length })})
			</div>
			{/* overflow transitions are too complex for plain tailwind, so we use a custom class */}
			<div className={'middle-stops-container' + (isOpen ? ' open' : '')}>
				{segment.stops.slice(1, -1).map((stop, i) => (
					<div
						className='my-2 pl-3 text-xs text-gray-600 dark:text-gray-300 has-stop-indicator small-indicator'
						style={{
							'--border-color': '#' + segment.line.color,
							'--data-index': i
						}}
						data-displayed={isOpen}
						key={stop.id}
					>
						{stop.name}
					</div>
				))}
			</div>
			<div
				className='font-bold leading-none has-stop-indicator mt-4'
				title={segment.stops[segment.stops.length - 1].name}
			>
				<span className='block whitespace-nowrap overflow-ellipsis w-full overflow-hidden'>
					{segment.stops[segment.stops.length - 1].name}
				</span>
			</div>
		</div>
	);
};

type ItineraryBreakdownProps = {
	itinerary: ItineraryWithTimings;
	onStationClick?: (stationId: string) => void;
};
const ItineraryBreakdown = ({
	itinerary,
	onStationClick
}: ItineraryBreakdownProps) => {
	return (
		<div className='relative w-full p-4'>
			<div className='flex flex-row *:shrink-0 items-center gap-1 mb-2 bg-gray-100 dark:bg-gray-600 dark:text-white p-2 rounded-lg overflow-x-auto'>
				{itinerary.segments.map((segment, i) => (
					<Fragment key={segment.line.id}>
						{segment.connectingDuration !== undefined && (
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
							src={`/metros/${segment.line.name}.png`}
							alt={segment.line.name}
							width={18}
							height={18}
							className='first:ml-auto last:mr-auto'
						/>
						{i !== itinerary.segments.length - 1 && (
							<MdKeyboardArrowRight size={18} />
						)}
					</Fragment>
				))}
			</div>
			<div className='flex flex-row dark:text-white gap-2 mb-4 justify-center *:flex *:flex-row *:items-center *:text-xs *:gap-1'>
				<div>
					<MdSchedule size={18} />
					{t('ItineraryBreakdown.duration', {
						duration: Math.ceil(getTotalDuration(itinerary) / 60)
					})}
				</div>
				<div>
					<MdDirectionsWalk size={18} />
					{t('ItineraryBreakdown.duration', {
						duration: Math.ceil(getTotalWalkingDuration(itinerary) / 60)
					})}
				</div>
				<div>
					<MdLocationPin size={18} />
					{t('ItineraryBreakdown.stops', { count: getTotalStops(itinerary) })}
				</div>
			</div>
			<div
				className='bg-green-400/50  rounded-sm p-1 text-sm flex items-center gap-1 text-green-950 dark:text-white my-2 cursor-help'
				title={t('ItineraryBreakdown.carbonTooltip')}
			>
				<RiLeafFill />
				<span>
					{t('ItineraryBreakdown.carbon')}
					<b>{Math.round(itinerary.carbonFootprint)}g</b>
				</span>
			</div>
			{itinerary.segments.map((segment, i) => (
				<div key={segment.line.id}>
					{i !== 0 && (
						<div className='h-12 border-l-6 dark:text-white border-dotted border-blue-500 my-1 pl-2 flex flex-row items-center gap-1'>
							<MdDirectionsWalk size={18} />
							<span>
								{segment.connectingDuration &&
									Math.ceil(segment.connectingDuration / 60)}{' '}
								min
							</span>
						</div>
					)}
					<ItineraryBreakdownPart
						segment={segment}
						onStationClick={onStationClick}
					/>
				</div>
			))}
		</div>
	);
};

export default ItineraryBreakdown;
