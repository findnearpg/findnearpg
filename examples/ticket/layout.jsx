export default function Layout({ children }) {
	return (
		<div className="p-10">
			<strong>inner header</strong>
			{children}
		</div>
	);
}
