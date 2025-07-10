import { t } from '@/lib/i18n';
import { Incident, ItinerarySegmentWithTimings } from '@/lib/types';
import { getSegmentDurationInMinutes, timeStringToDate } from '@/lib/utils';
import Image from 'next/image';
import { useState } from 'react';
import MetroLineInfo from '../LineInformation';
import TransferPositionCard from './TransferPositionCard';
import { IncidentCard } from '../Traffic';
import { MdKeyboardArrowDown } from 'react-icons/md';

type ItineraryBreakdownPartProps = {
	/** The segment of itinerary to display */
	segment: ItinerarySegmentWithTimings;
	/** Event handler when clicking on the information icon */
	onInformationClick?: (stationName: string) => void;
	/**
	 * The current incidents on the metro network.
	 * Filtered, they will be displayed on this segment if relevant.
	 */
	incidents?: Incident[];
};

// Allows us to inject CSS variables directly
// from the component template,
// in order to style the small stop indicators border color.
declare module 'react' {
	interface CSSProperties {
		/** Border color of a small stop indicator, corresponding to the line color */
		'--border-color'?: string;
		/** The index of a small stop indicator to compute its animation delay */
		'--data-index'?: number;
	}
}

/**
 * Displays a single segment of a given itinerary.
 */
const ItineraryBreakdownPart = ({
	segment,
	incidents,
	onInformationClick
}: ItineraryBreakdownPartProps) => {
	/**
	 * The time it takes travelling this segment
	 */
	const duration = getSegmentDurationInMinutes(segment);
	/**
	 * Whether the full path of this segment is displayed
	 */
	const [isOpen, setIsOpen] = useState(false);

	/**
	 * Incidents occuring on the line of this segment
	 */
	const relevantIncidents =
		incidents &&
		incidents.filter(
			(incident) =>
				incident.line.id === segment.line.id && incident.status === 'active'
		);

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
					onStationClick={onInformationClick}
				/>
			</div>
			<div>
				{segment.positionInTrain && (
					<TransferPositionCard position={segment.positionInTrain} />
				)}
				{relevantIncidents &&
					relevantIncidents.map((incident, i) => (
						<IncidentCard incident={incident} key={i} />
					))}
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

export default ItineraryBreakdownPart;
