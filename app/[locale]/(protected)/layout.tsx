// app/[locale]/(protected)/layout.tsx
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'

export default async function ProtectedLayout({
	children,
	params,
}: {
	children: React.ReactNode
	params: Promise<{ locale: string }>
}) {
	const session = await getSession()
	const { locale } = await params

	if (!session) {
		redirect(`/${locale}/login`)
	}

	return <>{children}</>
}
