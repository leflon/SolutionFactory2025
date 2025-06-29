import { LanguageProvider } from '@/components/LanguageProvider';
import '@/styles/main.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Metro Efrei Dodo',
	description: 'Votre assistant mobilité intelligent',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang='fr' className='bg-gray-150 dark:bg-gray-800'>
			<body>
				<LanguageProvider>{children}</LanguageProvider>
			</body>
		</html>
	);
}
