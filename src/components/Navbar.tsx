import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLanguage } from './LanguageProvider';
import { IoOptions } from "react-icons/io5";
import { Language, LanguageLabels } from '@/lib/i18n';

export default function Navbar() {
	const { lang, setLang } = useLanguage();
	const [darkMode, setDarkMode] = useState(false);
	const [showDropdown, setShowDropdown] = useState(false);

	useEffect(() => {
		if (darkMode) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}, [darkMode]);

	return (
		<div className="absolute z-50 w-full top-0 flex justify-between items-center px-6 py-4">
			<div className="group relative flex items-center">
				<div
					className="bg-white/60 dark:bg-gray-800/60 group-hover:bg-whie dark:group-hover:bg-gray-700 transition-all duration-300 rounded-full h-12 w-12 group-hover:w-48 overflow-hidden cursor-pointer px-2 flex items-center"
					style={{ minWidth: 48, minHeight: 48 }}
				>
					{/* Logo (poule) */}
					<Image
						src="/logos/Logo.png"
						width={45}
						height={45}
						alt={LanguageLabels[lang]}
						className="transition-all duration-300 flex-shrink-0"
					/>

					{/* Texte (nom complet sur 3 lignes) */}
					<div
						className="ml-3 text-sm font-bold text-black dark:text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 leading-4"
					>
						<div>Roule</div>
						<div>Ma Poule</div>
					</div>
				</div>
			</div>




			<div className="group relative flex items-center">
				{/* Conteneur principal */}
				<div
					className="bg-white/60 dark:bg-gray-800/60 group-hover:bg-white dark:group-hover:bg-gray-700 transition-all duration-300 rounded-full h-12 w-12 group-hover:w-64 overflow-hidden px-2 flex items-center"
					style={{ minWidth: 48, minHeight: 48 }}
				>
					{/* Icône ⋮ centrée au repos, disparaît au hover */}
					<div className="absolute left-0 top-0 w-12 h-12 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0">
						<span className="text-xl text-gray-800 dark:text-white"><IoOptions /></span>
					</div>

					{/* Contenu affiché au survol */}
					<div className="flex items-center gap-4 justify-center w-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
						{/* Sélecteur de langue */}
						<div className="relative">
							<button
								onClick={() => setShowDropdown((prev) => !prev)}
								className="flex items-center gap-2 text-gray-800 dark:text-white text-sm cursor-pointer"
							>
								<Image
									src={`/flags/${lang}.png`}
									width={20}
									height={12}
									alt={LanguageLabels[lang]}
								/>
								{LanguageLabels[lang]}
								<span
									className={`transition-transform duration-100 ${showDropdown ? 'rotate-180' : ''
										}`}
								>
									▼
								</span>
							</button>
						</div>
						{showDropdown && (
								<div className="absolute z-[100] cursor-pointer mt-2 w-32 bg-white dark:bg-gray-800 shadow-lg rounded">
									{Object.entries(LanguageLabels).map(([code, label]) => (
										<div
											key={code}
											onClick={() => {
												setLang(code as Language);
												setShowDropdown(false);
											}}
											className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
										>
											<Image
												src={`/flags/${code}.png`}
												width={20}
												height={12}
												alt={label}
											/>
											<span className="text-sm text-gray-800 dark:text-white">
												{label}
											</span>
										</div>
									))}
								</div>
							)}

						{/* Toggle dark mode */}
						<button
							onClick={() => setDarkMode(!darkMode)}
							className="text-xl text-gray-800 dark:text-white transition hover:scale-110 cursor-pointer"
						>
							{darkMode ? '🌙' : '☀️'}
						</button>
					</div>
				</div>
			</div>


		</div>
	);
}
