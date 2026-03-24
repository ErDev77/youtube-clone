// app/[locale]/layout.tsx
import type { Metadata } from 'next'
import '../globals.css'
import { LanguageProvider } from '@/context/LanguageContext'
import { AuthProvider } from '@/context/AuthContext'

export const metadata: Metadata = {
	title: 'ArmTube',
	description: 'Share your videos with friends, family, and the world',
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang='en'>
			<head>
				<link rel='preconnect' href='https://fonts.googleapis.com' />
				<link
					rel='preconnect'
					href='https://fonts.gstatic.com'
					crossOrigin='anonymous'
				/>
				<link
					href='https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap'
					rel='stylesheet'
				/>
			</head>
			<LanguageProvider>
				<AuthProvider>
					<body>{children}</body>
				</AuthProvider>
			</LanguageProvider>
		</html>
	)
}
