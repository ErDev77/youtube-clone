// import { redirect } from 'next/navigation'
// import { getSession } from '@/lib/auth/session'

// export default async function ProtectedLayout({ children }) {
// 	const session = await getSession() // reads cookie, verifies JWT
// 	if (!session) redirect('/en/login') // should never hit this if middleware works
// 	return <>{children}</>
// }
