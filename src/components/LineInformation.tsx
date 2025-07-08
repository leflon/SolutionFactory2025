import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FiInfo } from 'react-icons/fi';
import { FaDoorOpen, FaPeopleGroup, FaTrainSubway } from 'react-icons/fa6';
import { LuTrainTrack } from 'react-icons/lu';
import { FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import Image from 'next/image';
import LinePlan from './LinePlan';
import type { MetroLineInfo } from '@/lib/metroinfo';
import { t } from '@/lib/i18n';

type Station = {
	name: string;
	pointOfInterest?: string;
	imageUrl?: string;
};

type MetroLineInfoProps = {
	lineName: string;
	onStationClick?: (stationName: string) => void;
};

async function fetchLineInfo(lineId: string) {
	const res = await fetch(`/api/infos/${lineId}`);
	if (!res.ok)
		throw new Error(
			'Erreur lors de la récupération des informations de la ligne'
		);
	return await res.json();
}

export default function MetroLineInfo({
	lineName,
	onStationClick
}: MetroLineInfoProps) {
	const [showInfo, setShowInfo] = useState(false);
	const [selectedStation, setSelectedStation] = useState<Station | null>(null);
	const [informations, setInformations] = useState<MetroLineInfo | null>(null);
	const widgetRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		async function loadLineInfo() {
			try {
				const data = await fetchLineInfo(lineName);
				setInformations(data);
			} catch (error) {
				console.error(
					'Erreur lors de la récupération des informations de la ligne :',
					error
				);
			}
		}

		function handleClickOutside(event: MouseEvent) {
			if (
				widgetRef.current &&
				!widgetRef.current.contains(event.target as Node)
			) {
				setShowInfo(false);
				setSelectedStation(null);
			}
		}

		if (showInfo) {
			loadLineInfo();
			document.addEventListener('mousedown', handleClickOutside);
		} else {
			document.removeEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showInfo]);

	return (
		<div className='relative'>
			<button
				className='w-5 h-5 rounded-full border border-gray-400 flex items-center justify-center text-sm hover:bg-gray-200 transition'
				onClick={() => setShowInfo(!showInfo)}
				title='Informations sur la ligne'
			>
				<FiInfo className='w-4 h-4 text-gray-700 dark:text-white cursor-pointer' />
			</button>

			{showInfo && (
				<motion.div
					ref={widgetRef}
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0 }}
					className='fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-[95vw] max-w-3xl border border-gray-300 rounded-md shadow-lg bg-white p-4 dark:bg-gray-700 dark:border-gray-600 text-gray-800 dark:text-white'
				>
					<div className='flex items-center justify-center mb-4 gap-2'>
						<h2 className='text-lg font-bold dark:text-white'>
							Informations -
						</h2>
						<Image
							src={`/metros/${lineName}.png`}
							alt='Logo Métro'
							width={25}
							height={25}
							className='rounded-full shrink-0'
						/>
					</div>

					<div className='flex items-center gap-4 mb-4 justify-around'>
						<div
							className='flex items-center flex-col cursor-help'
							title={t('LineInformation.openingYear')}
						>
							<FaDoorOpen /> {informations?.date_ouverture}
						</div>
						<div
							className='flex items-center flex-col cursor-help'
							title={t('LineInformation.population')}
						>
							<FaPeopleGroup /> {informations?.nombre_voyageurs}
						</div>
						<div
							className='flex items-center flex-col cursor-help'
							title={t('LineInformation.vehicle')}
						>
							<FaTrainSubway /> {informations?.materiel_roulant}
						</div>
						<div
							className='flex items-center flex-col cursor-help'
							title={t('LineInformation.length')}
						>
							<LuTrainTrack /> {informations?.longueur_km + ' km'}
						</div>
						<div
							className='flex items-center flex-col cursor-help'
							title={t('LineInformation.nbStops')}
						>
							<FaMapMarkerAlt /> {informations?.nombre_stations}
						</div>
						<div
							className='flex items-center flex-col cursor-help'
							title={t('LineInformation.timeToCross')}
						>
							<FaClock /> {informations?.temps_trajet_minutes + ' min'}
						</div>
					</div>
					<LinePlan lineId={lineName} onStationClick={onStationClick} />
				</motion.div>
			)}
		</div>
	);
}
