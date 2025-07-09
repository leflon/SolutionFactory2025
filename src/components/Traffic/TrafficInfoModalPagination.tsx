import { Incident } from '@/lib/types';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import Image from 'next/image';

type TrafficInfoModalPaginationProps = {
	/** Optional class names to give this component for custom styling */
	className?: string;
	/** The incidents to paginate */
	incidents: Incident[];
	/** The incident currently being displayed */
	currentIncident: number;
	/** Set the incident currently being displayed */
	setCurrentIncident: Dispatch<SetStateAction<number>>;
};

/**
 * Pagination sub-component for `TrafficInfoModal`
 */
const TrafficInfoModalPagination = ({
	incidents,
	currentIncident,
	setCurrentIncident,
	className
}: TrafficInfoModalPaginationProps) => {
	/** Applied when the current incident was selected by automatic scrolling */
	const DEFAULT_ANIMATION_DURATION = 10_000;
	/** Applied after the user manually set the current incident */
	const LONG_ANIMATION_DURATION = 20_000;
	/** Represents the progress of the current page indicator animation. */
	const [animationState, setAnimationState] = useState(0);
	/** Represents the current timeframe of the whole animation helper */
	const globalAnimationTiming = useRef(0);
	/** Represents how long the currently selected page will stay selected before the next one. */
	const animationDuration = useRef(DEFAULT_ANIMATION_DURATION);
	/** Represents the timestamp of the beginning of the current animation. */
	const animationStartTime = useRef<number>(null);
	/** Holds the reference to the last requested animation frame, to cancel it on unmount */
	const animationFrame = useRef<number>(null);

	/** Derived size of the current progress indicator width from animation state */
	const currentIndicatorWidth =
		(animationState / animationDuration.current) * 100 + '%';

	/**
	 * Set the current incident from user interaction
	 */
	const manuallySetIncident = (i: number) => {
		if (i === currentIncident) return;
		setCurrentIncident(i);
		// Reset the animation, and make it longer to let the user read more comfortably.
		setAnimationState(0);
		animationStartTime.current = globalAnimationTiming.current;
		animationDuration.current = LONG_ANIMATION_DURATION;
	};

	/**
	 * Manages the animations of this component using `requestAnimationFrame`
	 */
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

	/* Start the animation on component mount and properly stop it on unmount */
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
						'relative h-1 md:h-2 bg-gray-200 dark:bg-white rounded-full transition-all duration-500 ' +
						(i === currentIncident
							? 'w-8 md:w-16' /* Progress bar container styling */
							: 'w-1 md:w-2 cursor-pointer hover:scale-150 group-hover:size-3')
					}
					onClick={() => manuallySetIncident(i)}
				>
					<div
						className={
							'h-full rounded-full transition-colors duration-500 delay-300 ' +
							(i === currentIncident
								? 'bg-gray-500 dark:bg-gray-400'
								: 'w-full bg-gray-300')
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

export default TrafficInfoModalPagination;
