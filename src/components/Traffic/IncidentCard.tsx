import { Incident } from '@/lib/types';
import { useState } from 'react';
import { MdKeyboardArrowDown } from 'react-icons/md';
import { IncidentIcon } from '.';

type IncidentCardProps = {
	/** The incident shown in this card */
	incident: Incident;
};

/**
 * Minimalist card displaying an incident's message.
 * To be used in `ItinerarySegment` component.
 */
const IncidentCard = ({ incident }: IncidentCardProps) => {
	/** Whether to display the full incident message. When false, only shows the short message. */
	const [isOpen, setIsOpen] = useState(false);

	const backgroundColor =
		incident.status === 'active'
			? incident.severity.color + 'AA' // Add alpha channel to hex color
			: '#BBBBBB40';

	return (
		<div
			className='px-2 py-1 rounded my-1'
			style={{
				backgroundColor
			}}
		>
			<div
				className='cursor-pointer font-bold flex justify-between items-center'
				onClick={() => setIsOpen(!isOpen)}
			>
				<IncidentIcon incident={incident} showBackground={false} />
				<span>{incident.shortMessage}</span>
				<MdKeyboardArrowDown
					size={24}
					className={'transition-transform ' + (isOpen ? 'rotate-180' : '')}
				/>
			</div>
			<div
				className={
					'transition-all overflow-hidden ' + (isOpen ? 'h-calc' : 'h-0')
				}
				dangerouslySetInnerHTML={{ __html: incident.message }}
			></div>
		</div>
	);
};

export default IncidentCard;
