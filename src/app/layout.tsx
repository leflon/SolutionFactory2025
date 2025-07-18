import { LanguageProvider } from '@/components/LanguageProvider';
import '@/styles/main.css';

export const metadata = {
	title: 'Roule Ma Poule',
	description: 'Votre assistant mobilité intelligent',
	icons: {
		apple: '/icons/apple-icon.png',
		shortcut: '/icons/favicon.ico',
		other: [
			{
				rel: 'icon',
				type: 'image/png',
				sizes: '96x96',
				url: '/icons/favicon.png'
			},
			{
				rel: 'icon',
				type: 'image/svg+xml',
				url: '/icons/favicon.svg'
			}
		]
	},
	applicationName: 'Roule Ma Poule',
	openGraph: {
		title: 'Roule Ma Poule | Votre assistant mobilité intelligent',
		description:
			'Découvrez Roule Ma Poule, l’assistant intelligent qui simplifie vos trajets dans les transports en commun parisiens.',
		url: 'https://rmp.leflon.fr',
		siteName: 'Roule Ma Poule',
		images: [
			{
				url: 'https://rmp.leflon.frog-image.jpg', // Make sure this image is at least 1200x630 pixels
				width: 1200,
				height: 630,
				alt: 'Roule Ma Poule'
			}
		],
		locale: 'fr_FR',
		type: 'website'
	},
	manifest: '/manifest.json',
	twitter: {
		card: 'summary_large_image',
		title: 'Roule Ma Poule | Votre assistant mobilité intelligent',
		description:
			'Découvrez Roule Ma Poule, l’assistant intelligent qui simplifie vos trajets dans les transports en commun parisiens.',
		images: ['https://rmp.leflon.fr/og-image.jpg']
	},
	other: {
		'apple-mobile-web-app-title': 'Roule Ma Poule'
	}
};

export default function RootLayout({
	children
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang='fr' className='bg-gray-150 dark:bg-gray-800'>
			<body className='w-screen h-screen'>
				<LanguageProvider>{children}</LanguageProvider>
			</body>
		</html>
	);
}
