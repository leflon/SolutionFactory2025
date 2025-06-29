'use client';

import ItinerarySelector from '@/components/ItinerarySelector';
import Navbar from '@/components/Navbar';
import { t } from '@/lib/i18n';
import { ItineraryEndpoints } from '@/lib/types';
import { useState } from 'react';

export default function Home() {
	const handleItineraryRequest = (endpoints: ItineraryEndpoints) => {
		console.log('Request: ', endpoints);
		// TODO: Implement
	};

	return (
		<div>
			<Navbar />
			<ItinerarySelector onRequest={handleItineraryRequest} />
		</div>
	);
}
