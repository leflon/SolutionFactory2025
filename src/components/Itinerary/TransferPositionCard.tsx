import { t } from '@/lib/i18n';
import { ItineraryTransferPosition } from '@/lib/types';
import Image from 'next/image';

type TransferPositionCardProps = {
	/**
	 * The recommended position to ride.
	 */
	position: ItineraryTransferPosition;
};

/**
 * Shows where to ride in a train to optimize transfers.
 * Used in `ItineraryBreakdownPart`
 */
const TransferPositionCard = ({ position }: TransferPositionCardProps) => {
	const possiblePositions = ['rear', 'mid', 'front'];

	return (
		<div className='bg-blue-400 text-white px-2 py-1 rounded my-1 flex items-center gap-2'>
			<span className='flex gap-[2px] items-center'>
				{possiblePositions.map((p) => (
					<Image
						key={p}
						src={
							p === position ? '/icons/rame-full.png' : '/icons/rame-empty.png'
						}
						alt=''
						width={24}
						height={12}
					/>
				))}
				{/* Head of train icon */}
				<Image src='/icons/rame-front.png' alt='' width={12} height={12} />
			</span>
			{t('ItineraryBreakdown.position.' + position)}
		</div>
	);
};

export default TransferPositionCard;
