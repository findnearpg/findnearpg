import * as ReactGoogleMaps from "@/client-integrations/react-google-maps";

const NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = import.meta.env
	.VITE_GOOGLE_MAPS_API_KEY;

function MainComponent() {
	return (
		<div className="min-h-screen flex flex-col md:flex-row">
			<section className="bg-gray-900 text-white p-4 md:w-1/2">
				<div className="container mx-auto">
					<h1 className="text-4xl font-bold font-montserrat">John Doe</h1>
					<p className="text-2xl font-roboto mt-2">Software Developer</p>
					<div className="mt-4">
						<a
							href="#"
							className="text-blue-400 hover:text-blue-500 mr-4 text-xl"
						>
							<i className="fab fa-twitter"></i> Twitter
						</a>
						<a
							href="#"
							className="text-blue-400 hover:text-blue-500 mr-4 text-xl"
						>
							<i className="fab fa-linkedin"></i> LinkedIn
						</a>
						<a href="#" className="text-blue-400 hover:text-blue-500 text-xl">
							<i className="fab fa-github"></i> GitHub
						</a>
					</div>
				</div>

				<footer className="container mx-auto mt-8">
					<h2 className="text-3xl font-bold mb-4 font-montserrat">
						Contact Me
					</h2>
					<form>
						<div className="mb-4">
							<label htmlFor="name" className="block mb-2 font-roboto">
								Name
							</label>
							<input
								type="text"
								id="name"
								name="name"
								className="w-full px-3 py-2 text-gray-700 rounded-md"
								required
							/>
						</div>
						<div className="mb-4">
							<label htmlFor="email" className="block mb-2 font-roboto">
								Email
							</label>
							<input
								type="email"
								id="email"
								name="email"
								className="w-full px-3 py-2 text-gray-700 rounded-md"
								required
							/>
						</div>
						<div className="mb-4">
							<label htmlFor="message" className="block mb-2 font-roboto">
								Message
							</label>
							<textarea
								id="message"
								name="message"
								rows="4"
								className="w-full px-3 py-2 text-gray-700 rounded-md"
								required
							></textarea>
						</div>
						<button
							type="submit"
							className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 font-roboto"
						>
							Send Message
						</button>
					</form>
				</footer>
			</section>

			<main className="flex-1 p-4 md:w-1/2">
				<ReactGoogleMaps.APIProvider apiKey={NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
					<div className="w-full h-[600px]">
						<ReactGoogleMaps.Map
							center={{ lat: 40.7812, lng: -73.9665 }}
							zoom={14}
							mapId="central-park-map"
						>
							<ReactGoogleMaps.Marker
								position={{ lat: 40.7812, lng: -73.9665 }}
								title="Central Park"
							/>
						</ReactGoogleMaps.Map>
					</div>
				</ReactGoogleMaps.APIProvider>
			</main>
		</div>
	);
}

export default MainComponent;
