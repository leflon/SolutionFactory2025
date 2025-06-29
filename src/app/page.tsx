'use client';

import ItinerarySelector from '@/components/ItinerarySelector';
import type { LanguageCode } from '@/components/Navbar';
import Navbar from '@/components/Navbar';
import { ItineraryEndpoints } from '@/lib/types';
import { useState } from 'react';

export default function Home() {
	const [language, setLanguage] = useState<LanguageCode>('fr');

	const handleItineraryRequest = (endpoints: ItineraryEndpoints) => {
		console.log('Request: ', endpoints);
		// TODO: Implement
	};

	return (
		<div>
			<Navbar language={language} setLanguage={setLanguage} />
			<ItinerarySelector onRequest={handleItineraryRequest} />
		</div>
	);
}
