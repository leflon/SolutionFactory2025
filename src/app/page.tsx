"use client";

//import Example from '@/components/Example';
import Fields from '@/components/Fields';
import Navbar from '@/components/Navbar';
import { useState } from 'react';
import type { LanguageCode } from '@/components/Navbar';
export default function Home() {
	const [language, setLanguage] = useState<LanguageCode>("fr");
	return (
		<div>
			<Navbar language={language} setLanguage={setLanguage} />
			<Fields language={language}/>
		</div>
	);
}
