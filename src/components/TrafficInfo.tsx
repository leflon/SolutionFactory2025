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

type TrafficInfoPaginationProps = {
	incidents: Incident[];
	currentIncident: number;
	setCurrentIncident: Dispatch<SetStateAction<number>>;
};

const TrafficInfoPagination = ({
	incidents,
	currentIncident,
	setCurrentIncident
}: TrafficInfoPaginationProps) => {
	// Represents the progress of the current page indicator animation.
	const [animationState, setAnimationState] = useState(0);
	// Represents the current timeframe of the whole animation helper
	const globalAnimationTiming = useRef(0);
	// Represents how long the currently selected page will stay selected before the next one.
	// For automatic pagination, that is 5000ms. If the user selects one manually, it switches to 10,000ms.
	const animationDuration = useRef(5000);
	// Represents the timestamp of the beginning of the current animation.
	const animationStartTime = useRef<number>(null);

	const currentIndicatorWidth =
		(animationState / animationDuration.current) * 100 + '%';

	const manuallySetIncident = (i: number) => {
		if (i === currentIncident) return;
		setCurrentIncident(i);
		// Reset the animation, and make it longer to let the user read more comfortably.
		setAnimationState(0);
		animationStartTime.current = globalAnimationTiming.current;
		animationDuration.current = 10_000;
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
			if (animationDuration.current !== 5000) animationDuration.current = 5000;
		} else setAnimationState(progress);

		requestAnimationFrame(animate);
	};

	useEffect(() => animate(), []);
	return (
		<div className='w-full flex gap-1 group justify-center items-center absolute bottom-1'>
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
	incidents: Incident[];
	lastUpdate: Date;
};

const TrafficInfo = ({ incidents, lastUpdate }: TrafficInfoProps) => {
	const [currentIncident, setCurrentIncident] = useState(0);

	const sortedIncidents = useMemo(() => {
		return incidents.slice().sort((a, b) => {
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
		});
	}, [incidents]);

	return (
		<div
			className='box-border fixed w-1/2 p-3 h-24 left-1/2 translate-x-[-50%]
			bottom-8 bg-white rounded-2xl border-[1px] border-gray-300
			shadow-lg flex items-center gap-3 *:transition-opacity *:duration-150'
		>
			<div className='absolute italic text-xs bottom-0 right-2 text-gray-300'>
				{t('TrafficInfo.lastUpdate', {
					time: lastUpdate.toLocaleTimeString(navigator.language, {
						hour: '2-digit',
						minute: '2-digit'
					})
				})}
			</div>
			<div
				key={'img' + currentIncident}
				className='relative shrink-0 animate-[fadeIn_1s_ease]'
			>
				<Image
					src={`/metros/${sortedIncidents[currentIncident].line.name}.png`}
					width={48}
					height={48}
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
				className='relative h-full flex flex-col animate-[fadeIn_1s_ease]'
			>
				<div className='relative text-lg font-bold'>
					{sortedIncidents[currentIncident].title}
				</div>
				<div
					className='relative text-sm overflow-auto'
					dangerouslySetInnerHTML={{
						__html: sortedIncidents[currentIncident].message
					}}
				></div>
			</div>
			<TrafficInfoPagination
				incidents={sortedIncidents}
				currentIncident={currentIncident}
				setCurrentIncident={setCurrentIncident}
			/>
		</div>
	);
};

export default TrafficInfo;
