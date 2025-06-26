"use client";

//import Example from '@/components/Example';
import Fields from '@/components/Fields';
import Navbar from '@/components/Navbar';
import { useState } from 'react';
import type { LanguageCode } from '@/components/Navbar';
import { Itinerary, PLACEHOLDER_ITINERARY } from '@/lib/Itinerary';
import ItineraryBreakdown from '@/components/ItineraryBreakdown';
export default function Home() {
	const [language, setLanguage] = useState<LanguageCode>("fr");

	return (
		<div>
			<Navbar language={language} setLanguage={setLanguage} />
			<Fields language={language}/>
			<ItineraryBreakdown itinerary={PLACEHOLDER_ITINERARY} />
		</div>
	);
}
