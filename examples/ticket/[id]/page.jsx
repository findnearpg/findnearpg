import { useParams } from 'react-router-dom';

export default function Index(params) {
	const { id } = useParams();

	const s = `useParams:${id} page params:${params.id}`;
	return <div>{s}</div>;
}
