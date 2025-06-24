import '@/styles/main.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'Metro Efrei Dodo',
	description: 'Votre assistant mobilité intelligent',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
	return (
		<html lang='fr' className="bg-gray-150 dark:bg-gray-800">
			<body className={inter.className}>{children}</body>
		</html>
	)
}
