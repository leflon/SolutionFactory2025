'use client';
import { Language } from '@/lib/i18n';
import { createContext, useContext, useState } from 'react';

const LanguageContext = createContext<{
	lang: Language;
	setLang: (lang: Language) => void;
} | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
	const [lang, setLang] = useState<Language>('en');
	return (
		<LanguageContext.Provider value={{ lang, setLang }}>
			{children}
		</LanguageContext.Provider>
	);
}

export function useLanguage() {
	const ctx = useContext(LanguageContext);
	if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
	return ctx;
}
