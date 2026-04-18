// app/[locale]/(public)/shorts/layout.tsx
// Minimal layout wrapper for the Shorts page.
// Suppresses body scroll so the custom scroll container owns all scroll events.
export default function ShortsLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<>
			<style>{`
        html, body {
          overflow: hidden !important;
          height: 100% !important;
        }
      `}</style>
			{children}
		</>
	)
}
