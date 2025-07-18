'use client';
import MetroLineInfo from '@/components/LineInformation';
import { t } from '@/lib/i18n';
import {
	Incident,
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
import { ItineraryBreakdownPart } from '.';

type ItineraryBreakdownProps = {
	/** The itinerary to display */
	itinerary: ItineraryWithTimings;
	/** The incidents on the metro network. */
	incidents?: Incident[];
	onInformationClick?: (stationId: string) => void;
};

/**
 * Displays all the details of a given itinerary
 */
const ItineraryBreakdown = ({
	itinerary,
	incidents,
	onInformationClick
}: ItineraryBreakdownProps) => {
	return (
		<div className='relative w-full p-4'>
			{/* Itinerary header (line icons / walking icons) */}
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
			{/* Itinerary *stats* (walking time, duration, stops count) */}
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
						incidents={incidents}
						onInformationClick={onInformationClick}
					/>
				</div>
			))}
		</div>
	);
};

export default ItineraryBreakdown;
