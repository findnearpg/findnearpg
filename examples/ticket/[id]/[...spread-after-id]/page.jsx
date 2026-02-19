import { useParams } from 'react-router-dom';

export default function Index(params) {
	const { id, '*': spread } = useParams();

	const s = `useParams:${id} ${spread} page params:${params.id} ${params['spread-after-id']}`;
	return <div>{s}</div>;
}
