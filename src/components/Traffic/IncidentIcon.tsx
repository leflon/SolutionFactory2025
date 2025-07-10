import { Incident } from '@/lib/types';
import { ReactNode } from 'react';
import { BiSolidTrafficCone } from 'react-icons/bi';
import { BsExclamation } from 'react-icons/bs';
import { IoClose } from 'react-icons/io5';

type IncidentIconProps = {
	incident: Incident;
	/**
	 * Whether to show the background of the icon.
	 * The color of the background is set based on the incident severity.
	 * @default true
	 */
	showBackground?: boolean;
	/**
	 * Color of the icon.
	 *
	 * @default 'inherit'
	 */
	color?: string;
};

const IncidentIcon = ({
	incident,
	showBackground = true,
	color = 'inherit'
}: IncidentIconProps) => {
	/* Set icon based on incident cause / severity */
	let icon: ReactNode;
	if (incident.cause === 'maintenance')
		icon = <BiSolidTrafficCone color={color} />;
	else if (incident.cause === 'disruption') {
		if (incident.severity.effect === 'NO_SERVICE')
			icon = <IoClose color={color} />;
		else icon = <BsExclamation color={color} />;
	}
	/* Set background color based on incident status / severity */
	let backgroundColor: string;
	if (incident.status === 'future')
		backgroundColor = '#BBBBBB'; // Gray if future incident
	else backgroundColor = incident.severity.color; // Else, just reuse provided color

	return (
		<div
			className='size-5 rounded flex items-center justify-center'
			style={{
				background: showBackground ? backgroundColor : 'transparent'
			}}
		>
			{icon}
		</div>
	);
};

export default IncidentIcon;
