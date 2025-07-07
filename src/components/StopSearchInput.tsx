import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

type StopSearchInputProps = {
	/** Callback function called when a stop is selected */
	onSelect: (stopId: string) => any;
	/** Placeholder text for the input */
	placeholder?: string;
	/** Label text for the input */
	label?: string;
	value: string | null;
};

type Stop = {
	stop_id: string;
	stop_name: string;
	route_names: string[];
};

const StopSearchInput = ({
	onSelect,
	placeholder,
	label,
	value
}: StopSearchInputProps) => {
	const [query, setQuery] = useState('');
	const [suggestedStops, setSuggestedStops] = useState<Stop[]>([]);
	const [showDropdown, setShowDropdown] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const inputRef = useRef<HTMLInputElement>(null);

	const debounceTimer = useRef<NodeJS.Timeout | null>(null);

	const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setQuery(e.target.value);
		if (e.target.value === '') setSuggestedStops([]);
	};

	const onStopSelect = (stop: Stop) => {
		setQuery(stop.stop_name);
		setShowDropdown(false);
		setSuggestedStops([]); // This improves sequential focus navigation
		onSelect(stop.stop_id);
	};

	useEffect(() => {
		if (value !== null) setQuery(value);
	}, [value]);

	useEffect(() => {
		if (debounceTimer.current) clearTimeout(debounceTimer.current);
		debounceTimer.current = setTimeout(async () => {
			if (query.length < 2) return;
			if (!showDropdown) return;
			setIsLoading(true);
			const res = await fetch(
				`/api/autocomplete?q=${encodeURIComponent(query)}`
			).then((res) => res.json());
			const { stops } = res;
			stops.forEach((stop: Stop) =>
				stop.route_names.sort((a, b) => parseInt(a) - parseInt(b))
			);
			setSuggestedStops(res.stops);
			setIsLoading(false);
			setShowDropdown(true);
		}, 300);

		return () => {
			if (debounceTimer.current) clearTimeout(debounceTimer.current);
		};
	}, [query]);

	return (
		<div className='relative inline-block w-full'>
			{label && <label className='mb-1 pl-2 font-bold'>{label}</label>}
			<div className='relative flex items-center'>
				<input
					type='text'
					className='peer w-full p-1 border-2 rounded-sm dark:border-white dark:text-white outline-0'
					value={query}
					onChange={onChange}
					onFocus={(e) => {
						e.target.select();
						setShowDropdown(true);
					}}
					onBlur={() => setShowDropdown(false)}
					/* Without this timeout, the child items click event don't fire */
					autoComplete='off'
					placeholder={placeholder}
				/>
				<div
					className='absolute right-2 w-4 h-4 px-2 bg-white dark:bg-gray-800'
					hidden={!isLoading}
				></div>
				<div
					className='absolute right-2 w-4 h-4 rounded-full border-2 border-black dark:border-white dark:border-t-transparent border-t-transparent animate-spin'
					hidden={!isLoading}
				></div>
			</div>
			<div
				className={
					`absolute top-full left-0 mt-1 border border-gray-300
					rounded dark:bg-gray-700 dark:text-white bg-white
					shadow-md max-h-60 overflow-y-auto w-xs z-10` +
					/* Using this rather than conditional rendering makes
					 		displaying/hiding the dropdown more flexible. */
					(suggestedStops.length > 0 && showDropdown
						? ' opacity-100 pointer-events-auto'
						: ' opacity-0 pointer-events-none')
				}
				tabIndex={-1}
			>
				{suggestedStops.map((stop) => (
					<button
						key={stop.stop_id}
						onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
							onStopSelect(stop);
							(e.target as HTMLButtonElement).blur();
						}}
						onFocus={() => setShowDropdown(true)}
						onBlur={() => setShowDropdown(false)}
						className='w-full flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer'
					>
						<div className='flex gap-1 mr-2 flex-shrink-0'>
							{stop.route_names.map((name, idx) => (
								<Image
									key={idx}
									src={`/metros/${name}.png`}
									alt={name}
									width={24}
									height={24}
								/>
							))}
						</div>
						<span className='whitespace-normal break-words'>
							{stop.stop_name}
						</span>
					</button>
				))}
			</div>
		</div>
	);
};
export default StopSearchInput;
