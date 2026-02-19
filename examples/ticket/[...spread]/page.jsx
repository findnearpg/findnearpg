import { useParams } from 'react-router-dom';
export default function Index(params) {
	const uParams = useParams();

	const s = `this is a spread route\n useParams:${uParams['*']} page params:${params.spread}`;
	return <div>{s}</div>;
}
