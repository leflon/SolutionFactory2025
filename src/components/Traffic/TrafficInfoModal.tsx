import { t } from '@/lib/i18n';
import { Incident } from '@/lib/types';
import Image from 'next/image';
import { useMemo, useRef, useState } from 'react';
import { MdClose } from 'react-icons/md';
import { IncidentIcon, TrafficInfoModalPagination } from '.';

type TrafficInfoModalProps = {
	/** All the available incidents to display */
	incidents: Incident[];
	/** The last time the data was fetched from IDFM */
	lastUpdate: Date;
	/** Filters incidents to display only those associated with this line Id */
	lineFilter?: string;
	/**
	 * Whether the element can be shrunk by the user, leaving only the line icon displayed.
	 * @default true
	 */
	shrinkable?: boolean;
};

/**
 * Modal displaying all real-time live traffic information
 */
const TrafficInfoModal = ({
	incidents,
	lastUpdate,
	lineFilter,
	shrinkable = true
}: TrafficInfoModalProps) => {
	/** The incident currently being diaplyed */
	const [currentIncident, setCurrentIncident] = useState(0);
	/** Whether the component is shrunk, displaying only a small clickable icon */
	const [isShrunk, setIsShrunk] = useState(false);
	/** For swipe actions on mobile, the start X position of a swipe */
	const touchStartX = useRef<number>(null);
	/** For swipe actions on mobile, the end X position of a swipe */
	const touchEndX = useRef<number>(null);

	/** The minimum distance a swipe must be to trigger its effect */
	const swipeThreshold = 50;
	/** Fires when a swipe ends. If the threshold is met, navigates through incidents. */
	const handleSwipe = () => {
		if (!touchStartX.current || !touchEndX.current) return;
		const swipedDistance = touchEndX.current - touchStartX.current;
		const n = incidents.length;
		if (swipedDistance > -swipeThreshold) {
			setCurrentIncident((n + currentIncident - 1) % n);
		}
		if (swipedDistance < swipeThreshold) {
			setCurrentIncident((n + currentIncident + 1) % n);
		}
	};

	/** Incidents sorted by order of importance. Current incidents come first, disruptions come before construction works. */
	const sortedIncidents = useMemo(() => {
		return incidents
			.slice()
			.sort((a, b) => {
				// First, sort by status: 'active' incidents come before others
				if (a.status === 'active' && b.status !== 'active') {
					return -1;
				}
				if (a.status !== 'active' && b.status === 'active') {
					return 1;
				}

				// Then sort by cause: 'disruption' events come before others
				if (a.cause === 'disruption' && b.cause !== 'disruption') {
					return -1;
				}
				if (a.cause !== 'disruption' && b.cause === 'disruption') {
					return 1;
				}

				// Finally sort by severity effect priority: NO_SERVICE > SIGNIFICANT_DELAYS > OTHER_EFFECT
				const severityPriority = {
					NO_SERVICE: 3,
					SIGNIFICANT_DELAYS: 2,
					OTHER_EFFECT: 1
				};

				const aPriority = severityPriority[a.severity.effect];
				const bPriority = severityPriority[b.severity.effect];

				return bPriority - aPriority;
			})
			.filter((incident) =>
				lineFilter ? incident.line.id === lineFilter : true
			);
	}, [incidents]);

	return (
		<div
			className={
				`z-30 box-border relative bg-background text-foreground rounded-2xl
				border-[1px] border-border text-left flex items-center gap-3 overflow-hidden group ` +
				(isShrunk
					? 'cursor-pointer rounded-full size-10 md:size-18 justify-center self-end hover:scale-110 transition-transform'
					: 'h-22 pl-3 w-full')
			}
			onClick={() => isShrunk && setIsShrunk(false)}
			onTouchStart={(e) => {
				setIsShrunk(false);
				touchStartX.current = e.changedTouches[0].screenX;
			}}
			onTouchEnd={(e) => {
				touchEndX.current = e.changedTouches[0].screenX;
				handleSwipe();
			}}
			onKeyDown={(e) =>
				isShrunk && (e.key === 'Enter' || e.key === ' ') && setIsShrunk(false)
			}
			// Makes the element tab focusable when shrunk to open through by tab-navigation
			tabIndex={isShrunk ? 0 : -1}
		>
			<button
				className='z-20 absolute top-1 right-1 !dark:text-white md:group-hover:opacity-100 md:opacity-0 cursor-pointer focus:opacity-100 rounded-full'
				hidden={isShrunk || !shrinkable}
				onClick={() => setIsShrunk(true)}
			>
				<MdClose size={24}></MdClose>
			</button>
			<div
				className={
					'absolute italic text-[6pt] md:text-xs bottom-0 right-5 text-gray-300 ' +
					(isShrunk ? 'opacity-0' : '')
				}
			>
				{t('TrafficInfo.lastUpdate', {
					time: lastUpdate.toLocaleTimeString(navigator.language, {
						hour: '2-digit',
						minute: '2-digit'
					})
				})}
			</div>
			<div
				key={'img' + currentIncident}
				className={'shrink-0 animate-[fadeIn_1s_ease] relative'}
			>
				<Image
					src={`/metros/${sortedIncidents[currentIncident].line.name}.png`}
					width={96}
					height={96}
					className={isShrunk ? 'size-2 md:size-9' : 'size-9 md:size-12'}
					alt={sortedIncidents[currentIncident].line.name}
				/>
				<div className='absolute top-[-6px] right-[-6px]'>
					<IncidentIcon
						incident={sortedIncidents[currentIncident]}
						color='white'
					/>
				</div>
			</div>
			<div
				key={'body' + currentIncident}
				className={
					'relative self-start h-10/12 flex-col animate-[fadeIn_1s_ease] transition-[width] duration-1000 overflow-x-hidden overflow-y-auto scrollbar- ' +
					(isShrunk ? 'hidden' : 'flex w-full')
				}
			>
				<div className='relative text-xs md:text-lg font-bold max-md:pr-4'>
					{sortedIncidents[currentIncident].title}
				</div>
				<div
					className='relative text-xs md:text-sm max-md:pr-4'
					dangerouslySetInnerHTML={{
						__html: sortedIncidents[currentIncident].message
					}}
				></div>
			</div>
			<TrafficInfoModalPagination
				className={isShrunk ? 'opacity-0' : ''}
				incidents={sortedIncidents}
				currentIncident={currentIncident}
				setCurrentIncident={setCurrentIncident}
			/>
		</div>
	);
};

export default TrafficInfoModal;
