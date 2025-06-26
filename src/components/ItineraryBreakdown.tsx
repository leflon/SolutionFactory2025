"use client";
import { getSegmentDurationInMinutes, Itinerary, ItinerarySegment } from '@/lib/Itinerary'
import { MdKeyboardArrowDown } from "react-icons/md";
import Image from 'next/image';
type ItineraryBreakdownPartProps = {
	segment: ItinerarySegment;
};

const ItineraryBreakdownPart = ({segment}: ItineraryBreakdownPartProps) => {
	const duration = getSegmentDurationInMinutes(segment);
	return (
		<div className='relative pl-4 my-4'>
			<div
				className='line-indicator'
				style={{backgroundColor: segment.lineColor}}>
			</div>
			<div className='font-bold leading-none has-station-indicator'>{segment.stops[0].name}</div>
			<div className='py-2 flex flex-row gap-2 items-center'>
				<Image
					src={`/metros/${segment.line}.png`}
					alt={segment.line}
					width={18}
					height={18}
					className='shrink-0 grow-0 w-max-content'
				/>
				<span>Direction <b>{segment.direction}</b></span>
			</div>
			<div className='flex flex-row items-center cursor-pointer'>
				<MdKeyboardArrowDown size={18}/>
				{duration} min ({segment.stops.length} arrêt{segment.stops.length > 1 ? 's' : ''})
				{/* TODO: Add mid-stations */}
			</div>
			<div className='font-bold leading-none has-station-indicator my-4'>{segment.stops[segment.stops.length - 1].name}</div>
		</div>
	);
}

type ItineraryBreakdownProps = {
	itinerary: Itinerary;
}
const ItineraryBreakdown = ({ itinerary }: ItineraryBreakdownProps) => {
	return (
		<div className='fixed bottom-10 left-10 h-1/2'>
			{itinerary.segments.map(segment => <ItineraryBreakdownPart key={segment.line} segment={segment} />)}
		</div>
	)
};

export default ItineraryBreakdown;
