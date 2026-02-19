import { useState } from 'react';

export default function BrokenImageGallery() {
	const sizes = Array.from({ length: 200 }, () => {
		const w = Math.floor(Math.random() * 1000) + 100;
		const h = Math.floor(Math.random() * 1000) + 100;
		const radius = Math.floor(Math.random() * 50);
		const objectFit = Math.random() > 0.5 ? 'cover' : 'contain';
		const display = Math.random() > 0.5 ? 'block' : 'inline-block';
		return { w, h, radius };
	});
	return (
		<section style={{ padding: 24 }}>
			<div className="flex flex-col gap-4">
				{Array.from({ length: 10 }, (_, i) => (
					<div className="flex flex-row gap-4" key={i}>
						{Array.from({ length: 4 }, () => (
							<img
								src={`https://example.com/this-image-does-not-exist-${i}.jpg`}
								width={100 + i * 100}
								height={100 + i * 100}
							/>
						))}
					</div>
				))}
				{sizes.map(({ w, h, radius, objectFit, display }, i) => (
					<img
						key={i}
						// Deliberately broken URL
						src={`https://example.com/this-image-does-not-exist-${i}.jpg`}
						width={w}
						height={h}
						style={{
							width: w,
							height: h,
							borderRadius: radius,
							// objectFit,
							display,
						}}
					/>
				))}
			</div>
		</section>
	);
}
