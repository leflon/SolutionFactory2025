import { Incident } from '@/lib/types';
import {
	Dispatch,
	SetStateAction,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react';
import Image from 'next/image';
import { BiSolidTrafficCone } from 'react-icons/bi';
import { BsExclamation } from 'react-icons/bs';
import { IoClose } from 'react-icons/io5';
import { t } from '@/lib/i18n';
import { MdClose } from 'react-icons/md';

type TrafficInfoPaginationProps = {
	className?: string;
	incidents: Incident[];
	currentIncident: number;
	setCurrentIncident: Dispatch<SetStateAction<number>>;
};

const TrafficInfoPagination = ({
	incidents,
	currentIncident,
	setCurrentIncident,
	className
}: TrafficInfoPaginationProps) => {
	const DEFAULT_ANIMATION_DURATION = 10_000;
	const LONG_ANIMATION_DURATION = 20_000;
	// Represents the progress of the current page indicator animation.
	const [animationState, setAnimationState] = useState(0);
	// Represents the current timeframe of the whole animation helper
	const globalAnimationTiming = useRef(0);
	// Represents how long the currently selected page will stay selected before the next one.
	const animationDuration = useRef(DEFAULT_ANIMATION_DURATION);
	// Represents the timestamp of the beginning of the current animation.
	const animationStartTime = useRef<number>(null);
	const animationFrame = useRef<number>(null);

	const currentIndicatorWidth =
		(animationState / animationDuration.current) * 100 + '%';

	const manuallySetIncident = (i: number) => {
		if (i === currentIncident) return;
		setCurrentIncident(i);
		// Reset the animation, and make it longer to let the user read more comfortably.
		setAnimationState(0);
		animationStartTime.current = globalAnimationTiming.current;
		animationDuration.current = LONG_ANIMATION_DURATION;
	};

	const animate = (timing?: DOMHighResTimeStamp) => {
		// Ignore the first frame
		if (!timing) return void requestAnimationFrame(animate);
		globalAnimationTiming.current = timing;
		// Init the first animation
		if (!animationStartTime.current) animationStartTime.current = timing;
		// Time elapsed between the beginning of the current animation and now
		const progress = timing - animationStartTime.current;
		// End of the current animation

		if (progress >= animationDuration.current) {
			// Automatically go to next incident
			setCurrentIncident((prev) => (prev + 1) % incidents.length);
			// Reset for next animation
			animationStartTime.current = timing;
			setAnimationState(0);
			// If the previous incident was user-selected, the animation was slower.
			// We go back to normal speed.
			if (animationDuration.current !== DEFAULT_ANIMATION_DURATION)
				animationDuration.current = DEFAULT_ANIMATION_DURATION;
		} else setAnimationState(progress);

		animationFrame.current = requestAnimationFrame(animate);
	};

	useEffect(() => {
		animate();
		return () => cancelAnimationFrame(animationFrame.current || 0);
	}, []);
	return (
		<div
			className={
				'w-full flex gap-1 group justify-center items-center absolute bottom-1 ' +
				className
			}
		>
			{incidents.map((incident, i) => (
				<div
					key={i}
					className={
						'relative h-2 bg-gray-200 rounded-full transition-all duration-500 ' +
						(i === currentIncident
							? 'w-16'
							: 'w-2 cursor-pointer hover:scale-150 group-hover:size-3')
					}
					onClick={() => manuallySetIncident(i)}
				>
					<div
						className={
							'h-full rounded-full transition-colors duration-500 delay-300 ' +
							(i === currentIncident ? 'bg-gray-500' : 'w-full bg-gray-300')
						}
						style={
							i === currentIncident ? { width: currentIndicatorWidth } : {}
						}
					></div>
					<Image
						src={`/metros/${incident.line.name}.png`}
						alt={incident.line.name}
						// We load the image a little bigger than its display since it will be subject to scale transformations.
						width={48}
						height={48}
						className={
							'absolute top-0 left-0 size-full pointer-events-none transition-opacity opacity-0 ' +
							(i !== currentIncident ? 'group-hover:opacity-100' : '')
						}
					/>
				</div>
			))}
		</div>
	);
};

type TrafficInfoProps = {
	/** All the available incidents to display */
	incidents: Incident[];
	/** The last time the data was fetched from IDFM */
	lastUpdate: Date;
	/** Filters incidents to display only those associated with this line Id */
	lineFilter?: string;
	/** Whether the element can be shrunk by the user, leaving only the line icon displayed. (Default: true) */
	shrinkable?: boolean;
};

const TrafficInfo = ({
	incidents,
	lastUpdate,
	lineFilter,
	shrinkable
}: TrafficInfoProps) => {
	const [currentIncident, setCurrentIncident] = useState(0);
	const [isShrunk, setIsShrunk] = useState(false);
	shrinkable ??= true;

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
				`box-border relative bg-white rounded-2xl border-[1px] border-gray-300 text-left
			flex items-center gap-3 overflow-hidden group ` +
				(isShrunk
					? 'cursor-pointer rounded-full size-18 justify-center self-end hover:scale-110 transition-transform'
					: 'h-22 pl-3 w-full')
			}
			onClick={() => isShrunk && setIsShrunk(false)}
			onKeyDown={(e) =>
				isShrunk && (e.key === 'Enter' || e.key === ' ') && setIsShrunk(false)
			}
			tabIndex={isShrunk ? 0 : -1}
		>
			<button
				className='z-50 absolute top-1 right-1 group-hover:opacity-100 opacity-0 cursor-pointer focus:opacity-100 rounded-full'
				hidden={isShrunk || !shrinkable}
				onClick={() => setIsShrunk(true)}
			>
				<MdClose size={24}></MdClose>
			</button>
			<div
				className={
					'absolute italic text-xs bottom-0 right-5 text-gray-300 ' +
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
					className={isShrunk ? 'size-9' : 'size-12'}
					alt={sortedIncidents[currentIncident].line.name}
				/>
				<div
					className='absolute top-[-6px] right-[-6px] w-5 h-5 rounded flex items-center justify-center'
					style={{
						backgroundColor:
							sortedIncidents[currentIncident].status === 'active'
								? sortedIncidents[currentIncident].severity.color
								: '#BBBBBB'
					}}
				>
					{sortedIncidents[currentIncident].cause === 'maintenance' && (
						<BiSolidTrafficCone color='white' />
					)}
					{sortedIncidents[currentIncident].cause === 'disruption' &&
						sortedIncidents[currentIncident].severity.effect ===
							'NO_SERVICE' && <IoClose color='white' />}
					{sortedIncidents[currentIncident].cause === 'disruption' &&
						sortedIncidents[currentIncident].severity.effect ===
							'SIGNIFICANT_DELAYS' && <BsExclamation color='white' />}
				</div>
			</div>
			<div
				key={'body' + currentIncident}
				className={
					'relative self-start h-10/12 flex-col animate-[fadeIn_1s_ease] transition-[width] duration-1000 overflow-x-hidden overflow-y-auto scrollbar- ' +
					(isShrunk ? 'hidden' : 'flex w-full')
				}
			>
				<div className='relative text-lg font-bold'>
					{sortedIncidents[currentIncident].title}
				</div>
				<div
					className='relative text-sm'
					dangerouslySetInnerHTML={{
						__html: sortedIncidents[currentIncident].message
					}}
				></div>
			</div>
			<TrafficInfoPagination
				className={isShrunk ? 'opacity-0' : ''}
				incidents={sortedIncidents}
				currentIncident={currentIncident}
				setCurrentIncident={setCurrentIncident}
			/>
		</div>
	);
};

export default TrafficInfo;
