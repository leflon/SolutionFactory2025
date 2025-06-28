import { useState, useEffect } from "react";
import Image from 'next/image';

export type LanguageCode = 'en' | 'fr';

const languages: Record<LanguageCode, string> = {
	en: 'English',
	fr: 'Français'
};

type NavbarProps = {
	language: LanguageCode;
	setLanguage: (lang: LanguageCode) => void;
};

export default function Navbar({ language, setLanguage }: NavbarProps) {
	const [darkMode, setDarkMode] = useState(false);
	const [showDropdown, setShowDropdown] = useState(false);

	useEffect(() => {
	if (darkMode) {
		document.documentElement.classList.add("dark");
	} else {
		document.documentElement.classList.remove("dark");
	}
	}, [darkMode]);

	return (
	<nav className="flex justify-between items-center px-6 py-4 bg-white dark:bg-gray-900 shadow-md relative">
		<div className="text-lg font-bold text-gray-800 dark:text-white">🚆 MEDOC</div>

		<div className="flex items-center gap-4">
		{/* Custom Language Dropdown */}
		<div className="relative">
			<button
			onClick={() => setShowDropdown((prev) => !prev)}
			className="flex items-center gap-2 text-gray-800 dark:text-white cursor-pointer text-sm"
			>
			<Image
				src={`/flags/${language}.png`}
				width={20}
				height={12}
				alt={languages[language]}
			/>
			{languages[language]}
			<span
				className={"text-gray-800 dark:text-white transition-transform duration-100"
					+ (showDropdown ? " rotate-180" : "")}
			>
				▼
			</span>
			</button>

			{showDropdown && (
			<div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 shadow-lg rounded">
				{Object.entries(languages).map(([code, label]) => (
				<div
					key={code}
					onClick={() => {
					setLanguage(code as LanguageCode);
					setShowDropdown(false);
					}}
					className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
				>
					<Image src={`/flags/${code}.png`} width={20} height={12} alt={label} />
					<span className="text-sm text-gray-800 dark:text-white">{label}</span>
				</div>
				))}
			</div>
			)}
		</div>

		{/* Dark Mode Toggle */}
		<button
			onClick={() => setDarkMode(!darkMode)}
			className="text-xl transition hover:scale-110"
		>
			{darkMode ? "🌙" : "☀️"}
		</button>
		</div>
	</nav>
	);
}
