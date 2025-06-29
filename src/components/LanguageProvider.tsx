'use client';
import { Language } from '@/lib/i18n';
import { createContext, useContext, useState } from 'react';

// Creates a React context to store the current language and its updater function.
// Initialized as null to enforce usage within a provider.
const LanguageContext = createContext<{
	lang: Language;
	setLang: (lang: Language) => void;
} | null>(null);

// Provider component that manages language state and supplies it via context.
// Wrap parts of the app that need access to language state with this component. (in our case, the whole app)
export function LanguageProvider({ children }: { children: React.ReactNode }) {
	const [lang, setLang] = useState<Language>('en');
	//
	// Provide the current language and the updater function to descendants.
	return (
		<LanguageContext.Provider value={{ lang, setLang }}>
			{children}
		</LanguageContext.Provider>
	);
}

// Custom hook to access language context.
// Useful in `NavBar` to select language, and in the `t` function to automatically select the locale.
export function useLanguage() {
	const ctx = useContext(LanguageContext);
	if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
	return ctx;
}
