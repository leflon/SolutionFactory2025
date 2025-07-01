'use client';

import ItineraryBreakdown from '@/components/ItineraryBreakdown';
import ItinerarySelector from '@/components/ItinerarySelector';
import Navbar from '@/components/Navbar';
import dynamic from 'next/dynamic';
import { t } from '@/lib/i18n';
import { PLACEHOLDER_ITINERARY } from '@/lib/Itinerary';
import { ItineraryEndpoints } from '@/lib/types';
import { useState } from 'react';

const MapInteractive = dynamic(() => import('../components/Map'), { ssr: false });

export default function Home() {
    const handleItineraryRequest = (endpoints: ItineraryEndpoints) => {
        console.log('Request: ', endpoints);
        // TODO: Implement API call to fetch itinerary based on endpoints
    };

    return (
        <div>
            <Navbar />
            <ItinerarySelector onRequest={handleItineraryRequest} />
            <MapInteractive />
            <ItineraryBreakdown itinerary={PLACEHOLDER_ITINERARY} />
        </div>
    );
}
