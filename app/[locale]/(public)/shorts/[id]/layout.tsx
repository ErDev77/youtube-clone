// app/[locale]/(public)/shorts/[id]/layout.tsx
// Inherits the same scroll-suppression as the parent shorts layout.
export default function ShortsItemLayout({
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
